create table if not exists public.mobile_staff_tasks (
 id uuid primary key default gen_random_uuid(), employee_name text not null, pet_name text not null, customer_name text not null,
 task_type text not null check(task_type in ('Grooming','Boarding','Pickup','Medication','Cleaning')), title text not null,
 scheduled_time time not null, location text, status text not null default 'Pending' check(status in ('Pending','In Progress','Completed')),
 notes text, updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.employee_shift_sessions (
 id uuid primary key default gen_random_uuid(), employee_name text not null, clock_in_at timestamptz not null default now(),
 clock_out_at timestamptz, break_minutes integer not null default 0 check(break_minutes>=0), created_at timestamptz not null default now()
);
create index if not exists mobile_staff_tasks_employee_idx on public.mobile_staff_tasks(employee_name,status,scheduled_time);
create index if not exists employee_shift_sessions_open_idx on public.employee_shift_sessions(employee_name,clock_out_at);
alter table public.mobile_staff_tasks enable row level security;
alter table public.employee_shift_sessions enable row level security;
drop policy if exists "Authenticated users manage mobile staff tasks" on public.mobile_staff_tasks;
create policy "Authenticated users manage mobile staff tasks" on public.mobile_staff_tasks for all to authenticated using(true) with check(true);
drop policy if exists "Authenticated users manage shift sessions" on public.employee_shift_sessions;
create policy "Authenticated users manage shift sessions" on public.employee_shift_sessions for all to authenticated using(true) with check(true);
grant select,insert,update,delete on public.mobile_staff_tasks to authenticated;
grant select,insert,update,delete on public.employee_shift_sessions to authenticated;
