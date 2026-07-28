do $$
begin
  create type public.food_menu_status as enum (
    'pending_director',
    'rejected_director',
    'approved'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.food_menus (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id),
  title text not null default 'Weekly Food Menu',
  week_start date not null,
  week_end date not null,
  items jsonb not null,
  status public.food_menu_status not null default 'pending_director',
  submitted_by uuid not null references public.profiles(id),
  submitted_at timestamptz not null default now(),
  director_reviewed_by uuid references public.profiles(id),
  director_reviewed_at timestamptz,
  director_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_menus_valid_week check (week_end = week_start + 6),
  constraint food_menus_items_array check (jsonb_typeof(items) = 'array')
);

create unique index if not exists idx_food_menus_hostel_week
on public.food_menus(hostel_id, week_start);

create index if not exists idx_food_menus_status
on public.food_menus(status, created_at desc);

create index if not exists idx_food_menus_hostel_status
on public.food_menus(hostel_id, status, week_start desc);

create or replace function public.hostel_name_for_role(profile_role public.user_role)
returns text
language sql
immutable
as $$
  select case profile_role
    when 'mkg-boys-warden' then 'MKG Boys Hostel'
    when 'mkg-girls-warden' then 'MKG Girls Hostel'
    when 'nri-boys-warden' then 'NRI Boys Hostel'
    when 'nri-girls-warden' then 'NRI Girls Hostel'
    else null
  end;
$$;

drop trigger if exists touch_food_menus_updated_at on public.food_menus;
create trigger touch_food_menus_updated_at
before update on public.food_menus
for each row execute function public.touch_updated_at();

alter table public.food_menus enable row level security;

drop policy if exists "Students can read approved own hostel food menus" on public.food_menus;
create policy "Students can read approved own hostel food menus"
on public.food_menus for select
to authenticated
using (
  status = 'approved'
  and exists (
    select 1 from public.students s
    where s.profile_id = auth.uid()
      and s.hostel_id = food_menus.hostel_id
      and s.active = true
  )
);

drop policy if exists "Wardens can read own hostel food menus" on public.food_menus;
create policy "Wardens can read own hostel food menus"
on public.food_menus for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text like '%-warden'
      and (
        p.hostel_id = food_menus.hostel_id
        or exists (
          select 1 from public.hostels h
          where h.id = food_menus.hostel_id
            and h.name = public.hostel_name_for_role(p.role)
        )
      )
  )
);

drop policy if exists "Director can read all food menus" on public.food_menus;
create policy "Director can read all food menus"
on public.food_menus for select
to authenticated
using (public.current_profile_role() = 'director');

drop policy if exists "Wardens can create own hostel food menus" on public.food_menus;
create policy "Wardens can create own hostel food menus"
on public.food_menus for insert
to authenticated
with check (
  status = 'pending_director'
  and submitted_by = auth.uid()
  and director_reviewed_by is null
  and director_reviewed_at is null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text like '%-warden'
      and (
        p.hostel_id = food_menus.hostel_id
        or exists (
          select 1 from public.hostels h
          where h.id = food_menus.hostel_id
            and h.name = public.hostel_name_for_role(p.role)
        )
      )
  )
);

drop policy if exists "Wardens can revise pending own hostel food menus" on public.food_menus;
create policy "Wardens can revise pending own hostel food menus"
on public.food_menus for update
to authenticated
using (
  status in ('pending_director', 'rejected_director')
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text like '%-warden'
      and (
        p.hostel_id = food_menus.hostel_id
        or exists (
          select 1 from public.hostels h
          where h.id = food_menus.hostel_id
            and h.name = public.hostel_name_for_role(p.role)
        )
      )
  )
)
with check (
  status = 'pending_director'
  and submitted_by = auth.uid()
  and director_reviewed_by is null
  and director_reviewed_at is null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text like '%-warden'
      and (
        p.hostel_id = food_menus.hostel_id
        or exists (
          select 1 from public.hostels h
          where h.id = food_menus.hostel_id
            and h.name = public.hostel_name_for_role(p.role)
        )
      )
  )
);

drop policy if exists "Director can review food menus" on public.food_menus;
create policy "Director can review food menus"
on public.food_menus for update
to authenticated
using (public.current_profile_role() = 'director')
with check (public.current_profile_role() = 'director');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'food_menus'
    ) then
      alter publication supabase_realtime add table public.food_menus;
    end if;
  end if;
end $$;
