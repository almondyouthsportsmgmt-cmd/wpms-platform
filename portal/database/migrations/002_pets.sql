create extension if not exists pgcrypto;

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  species text not null default 'Dog',
  breed text,
  color text,
  sex text not null default 'Unknown' check (sex in ('Male', 'Female', 'Unknown')),
  birthday date,
  weight_pounds numeric(7,2) check (weight_pounds is null or weight_pounds >= 0),
  size text not null default 'Medium' check (size in ('Small', 'Medium', 'Large', 'Giant')),
  microchip_number text,
  veterinarian_name text,
  veterinarian_phone text,
  allergies text,
  medical_alerts text,
  behavior_notes text,
  grooming_notes text,
  preferred_groomer text,
  vaccination_rabies_expires_on date,
  vaccination_bordetella_expires_on date,
  vaccination_dhpp_expires_on date,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pets_customer_id_idx on public.pets(customer_id);
create index if not exists pets_name_idx on public.pets(lower(name));
create index if not exists pets_active_idx on public.pets(is_active);

create or replace function public.set_pets_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at before update on public.pets
for each row execute function public.set_pets_updated_at();

alter table public.pets enable row level security;

drop policy if exists "Authenticated staff can view pets" on public.pets;
drop policy if exists "Authenticated staff can create pets" on public.pets;
drop policy if exists "Authenticated staff can update pets" on public.pets;

create policy "Authenticated staff can view pets" on public.pets
for select to authenticated using (true);
create policy "Authenticated staff can create pets" on public.pets
for insert to authenticated with check (true);
create policy "Authenticated staff can update pets" on public.pets
for update to authenticated using (true) with check (true);

grant select, insert, update on public.pets to authenticated;
