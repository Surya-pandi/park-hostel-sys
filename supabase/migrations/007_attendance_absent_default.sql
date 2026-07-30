-- Treat missing QR scans as absent instead of pending.

update public.attendance
set status = 'absent'
where status = 'pending';

alter table public.attendance
  alter column status drop default;

create type public.attendance_status_without_pending as enum ('present', 'absent', 'late');

alter table public.attendance
  alter column status type public.attendance_status_without_pending
  using status::text::public.attendance_status_without_pending;

drop type public.attendance_status;

alter type public.attendance_status_without_pending
  rename to attendance_status;

alter table public.attendance
  alter column status set default 'absent';
