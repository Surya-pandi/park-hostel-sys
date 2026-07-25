-- PCET Hostel Attendance Management System
-- Apply with: supabase db push

create extension if not exists pgcrypto;

create type public.user_role as enum (
  'student',
  'mkg-boys-warden',
  'mkg-girls-warden',
  'nri-boys-warden',
  'nri-girls-warden',
  'ao',
  'director'
);

create type public.attendance_status as enum ('present', 'absent', 'late', 'pending');
create type public.notification_severity as enum ('info', 'success', 'warning', 'critical');

create table public.hostels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  gender text not null check (gender in ('boys', 'girls')),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'student',
  hostel_id uuid references public.hostels(id),
  force_password_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  admission_no text unique,
  full_name text not null,
  email text not null unique,
  date_of_birth date not null,
  academic_year text not null check (academic_year in ('I', 'II', 'III', 'IV')),
  department text not null,
  hostel_id uuid not null references public.hostels(id),
  hostel_name text not null,
  room_number text not null,
  sharing text not null,
  student_phone text not null,
  parent_phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wardens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id),
  designation text not null default 'Warden',
  created_at timestamptz not null default now()
);

create table public.qr_tokens (
  id uuid primary key default gen_random_uuid(),
  token_uuid uuid not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  nonce text not null unique,
  payload jsonb not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint qr_tokens_expiry_after_create check (expires_at > created_at)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in_time timestamptz,
  status public.attendance_status not null default 'pending',
  verified_by uuid references public.profiles(id),
  qr_token_id uuid unique references public.qr_tokens(id),
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

create table public.attendance_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  student_id uuid references public.students(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'All',
  severity public.notification_severity not null default 'info',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  table_name text not null,
  action text not null,
  row_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_hostel on public.profiles(hostel_id);
create index idx_students_hostel on public.students(hostel_id);
create index idx_students_department on public.students(department);
create index idx_students_room on public.students(hostel_id, room_number);
create index idx_attendance_date on public.attendance(attendance_date);
create index idx_attendance_student_date on public.attendance(student_id, attendance_date desc);
create index idx_attendance_status on public.attendance(status);
create index idx_qr_tokens_student_created on public.qr_tokens(student_id, created_at desc);
create index idx_qr_tokens_expiry on public.qr_tokens(expires_at);
create index idx_notifications_audience on public.notifications(audience);

insert into public.hostels (name, gender, code)
values
  ('MKG Boys Hostel', 'boys', 'MKG-B'),
  ('MKG Girls Hostel', 'girls', 'MKG-G'),
  ('NRI Boys Hostel', 'boys', 'NRI-B'),
  ('NRI Girls Hostel', 'girls', 'NRI-G')
on conflict (name) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger touch_students_updated_at
before update on public.students
for each row execute function public.touch_updated_at();

create or replace function public.current_profile_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_hostel_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hostel_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_office_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() in ('ao', 'director');
$$;

alter table public.hostels enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.wardens enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "Authenticated users can read hostels"
on public.hostels for select
to authenticated
using (true);

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_office_role());

create policy "Users can update own profile basics"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.current_profile_role() = 'director')
with check (id = auth.uid() or public.current_profile_role() = 'director');

create policy "Students can read own student row"
on public.students for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_office_role()
  or hostel_id = public.current_profile_hostel_id()
);

create policy "Office roles can manage students"
on public.students for all
to authenticated
using (public.is_office_role())
with check (public.is_office_role());

create policy "Wardens can read own hostel assignment"
on public.wardens for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_office_role()
);

create policy "Students can insert own QR tokens"
on public.qr_tokens for insert
to authenticated
with check (
  exists (
    select 1 from public.students s
    where s.id = student_id and s.profile_id = auth.uid()
  )
);

create policy "Students can read own QR tokens"
on public.qr_tokens for select
to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = student_id and s.profile_id = auth.uid()
  )
  or public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
);

create policy "Wardens can mark QR tokens used"
on public.qr_tokens for update
to authenticated
using (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
)
with check (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
);

create policy "Attendance visible by ownership and role"
on public.attendance for select
to authenticated
using (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id
    and (s.profile_id = auth.uid() or s.hostel_id = public.current_profile_hostel_id())
  )
);

create policy "Wardens and office roles can insert attendance"
on public.attendance for insert
to authenticated
with check (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
);

create policy "Wardens and office roles can update attendance"
on public.attendance for update
to authenticated
using (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
)
with check (
  public.is_office_role()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.hostel_id = public.current_profile_hostel_id()
  )
);

create policy "Authenticated users can insert attendance logs"
on public.attendance_logs for insert
to authenticated
with check (actor_id = auth.uid() or public.is_office_role());

create policy "Office roles can read attendance logs"
on public.attendance_logs for select
to authenticated
using (public.is_office_role());

create policy "Users can read targeted notifications"
on public.notifications for select
to authenticated
using (
  audience = 'All'
  or audience = public.current_profile_role()::text
  or (public.current_profile_role()::text like '%warden' and audience = 'Warden')
  or (public.current_profile_role() = 'ao' and audience = 'AO')
  or (public.current_profile_role() = 'director' and audience = 'Director')
  or (public.current_profile_role() = 'student' and audience = 'Student')
);

create policy "Office roles can manage notifications"
on public.notifications for all
to authenticated
using (public.is_office_role())
with check (public.is_office_role());

create policy "Director and AO can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_office_role());
