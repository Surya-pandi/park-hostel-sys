alter table public.students
add column if not exists blood_group text
check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
