create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  mobile_phone text,
  role text not null check (role in ('Owner','Manager','Groomer','Bather','Boarding Attendant','Receptionist')),
  status text not null default 'Active' check (status in ('Active','Inactive')),
  hire_date date,
  hourly_rate numeric(10,2) not null default 0 check (hourly_rate >= 0),
  color_code text not null default '#99e83f',
  notes text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_status_idx on public.employees(status);
create index if not exists employees_role_idx on public.employees(role);
create index if not exists employees_name_idx on public.employees(last_name, first_name);

create or replace function public.set_employees_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_employees_updated_at();

alter table public.employees enable row level security;

drop policy if exists "Authenticated users view employees" on public.employees;
create policy "Authenticated users view employees"
on public.employees for select to authenticated
using (true);

drop policy if exists "Authenticated users manage employees" on public.employees;
create policy "Authenticated users manage employees"
on public.employees for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.employees to authenticated;
