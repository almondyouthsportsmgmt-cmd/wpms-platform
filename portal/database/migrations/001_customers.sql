create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  mobile_phone text not null,
  home_phone text,
  email text,
  street_address text,
  city text,
  state text,
  zip_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_relationship text,
  preferred_contact_method text not null default 'Text' check (preferred_contact_method in ('Text', 'Call', 'Email')),
  marketing_opt_in boolean not null default false,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_name_idx on public.customers (last_name, first_name);
create index if not exists customers_mobile_idx on public.customers (mobile_phone);
create index if not exists customers_email_idx on public.customers (lower(email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

drop policy if exists "Authenticated staff can view customers" on public.customers;
drop policy if exists "Authenticated staff can create customers" on public.customers;
drop policy if exists "Authenticated staff can update customers" on public.customers;

create policy "Authenticated staff can view customers"
on public.customers for select
to authenticated
using (true);

create policy "Authenticated staff can create customers"
on public.customers for insert
to authenticated
with check (true);

create policy "Authenticated staff can update customers"
on public.customers for update
to authenticated
using (true)
with check (true);

grant select, insert, update on public.customers to authenticated;
