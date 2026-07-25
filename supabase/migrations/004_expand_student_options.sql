alter table public.students
drop constraint if exists students_blood_group_check;

alter table public.students
add constraint students_blood_group_check
check (blood_group in ('A+', 'A1+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
