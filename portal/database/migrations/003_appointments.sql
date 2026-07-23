create extension if not exists pgcrypto;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  appointment_type text not null default 'Grooming' check (appointment_type in ('Grooming','Bath','Nails','Boarding','Other')),
  service_name text not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  assigned_staff text,
  status text not null default 'Scheduled' check (status in ('Scheduled','Confirmed','Checked In','In Service','Ready for Pickup','Completed','Cancelled','No Show')),
  price_estimate numeric(10,2) check (price_estimate is null or price_estimate >= 0),
  notes text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_time check (end_time > start_time)
);

create index if not exists appointments_date_time_idx on public.appointments(appointment_date, start_time);
create index if not exists appointments_customer_idx on public.appointments(customer_id);
create index if not exists appointments_pet_idx on public.appointments(pet_id);
create index if not exists appointments_status_idx on public.appointments(status);

create or replace function public.set_appointments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_appointments_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "Authenticated users manage appointments" on public.appointments;
create policy "Authenticated users manage appointments"
on public.appointments for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.appointments to authenticated;
