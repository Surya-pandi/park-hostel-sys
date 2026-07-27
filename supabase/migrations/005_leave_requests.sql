do $$
begin
  create type public.leave_request_status as enum (
    'pending_warden',
    'rejected_warden',
    'pending_ao',
    'rejected_ao',
    'pending_director',
    'rejected_director',
    'approved'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id),
  from_date date not null,
  to_date date not null,
  reason text not null check (length(trim(reason)) >= 10),
  status public.leave_request_status not null default 'pending_warden',
  warden_reviewed_by uuid references public.profiles(id),
  warden_reviewed_at timestamptz,
  warden_note text,
  ao_reviewed_by uuid references public.profiles(id),
  ao_reviewed_at timestamptz,
  ao_note text,
  director_reviewed_by uuid references public.profiles(id),
  director_reviewed_at timestamptz,
  director_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_valid_dates check (to_date >= from_date)
);

create index if not exists idx_leave_requests_student
on public.leave_requests(student_id, created_at desc);

create index if not exists idx_leave_requests_hostel_status
on public.leave_requests(hostel_id, status, created_at desc);

create index if not exists idx_leave_requests_status
on public.leave_requests(status, created_at desc);

drop trigger if exists touch_leave_requests_updated_at on public.leave_requests;
create trigger touch_leave_requests_updated_at
before update on public.leave_requests
for each row execute function public.touch_updated_at();

alter table public.leave_requests enable row level security;

drop policy if exists "Students can create own leave requests" on public.leave_requests;
create policy "Students can create own leave requests"
on public.leave_requests for insert
to authenticated
with check (
  profile_id = auth.uid()
  and status = 'pending_warden'
  and warden_reviewed_by is null
  and warden_reviewed_at is null
  and ao_reviewed_by is null
  and ao_reviewed_at is null
  and director_reviewed_by is null
  and director_reviewed_at is null
  and exists (
    select 1 from public.students s
    where s.id = student_id
      and s.profile_id = auth.uid()
      and s.hostel_id = leave_requests.hostel_id
      and s.active = true
  )
);

drop policy if exists "Students can read own leave requests" on public.leave_requests;
create policy "Students can read own leave requests"
on public.leave_requests for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.students s
    where s.id = student_id and s.profile_id = auth.uid()
  )
);

drop policy if exists "Wardens can read hostel leave requests" on public.leave_requests;
create policy "Wardens can read hostel leave requests"
on public.leave_requests for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text like '%-warden'
      and p.hostel_id = leave_requests.hostel_id
  )
);

drop policy if exists "AO and director can read leave requests" on public.leave_requests;
create policy "AO and director can read leave requests"
on public.leave_requests for select
to authenticated
using (public.current_profile_role() in ('ao', 'director'));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leave_requests'
    ) then
      alter publication supabase_realtime add table public.leave_requests;
    end if;
  end if;
end $$;
