create table if not exists public.grooming_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  description text,
  appointment_type text not null default 'Grooming',
  duration_minutes integer not null default 60 check (duration_minutes >= 5),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  taxable boolean not null default false,
  book_online boolean not null default true,
  species text not null default 'All',
  minimum_weight numeric(8,2),
  maximum_weight numeric(8,2),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grooming_services_category_idx
  on public.grooming_services(category, display_order, name);

alter table public.grooming_services enable row level security;

drop policy if exists "Authenticated users manage grooming services"
  on public.grooming_services;

create policy "Authenticated users manage grooming services"
  on public.grooming_services
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete
  on public.grooming_services
  to authenticated;

alter table public.appointments
  add column if not exists service_id uuid references public.grooming_services(id);

create index if not exists appointments_service_id_idx
  on public.appointments(service_id);

create or replace function public.set_grooming_service_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grooming_services_set_updated_at
  on public.grooming_services;

create trigger grooming_services_set_updated_at
before update on public.grooming_services
for each row
execute function public.set_grooming_service_updated_at();
