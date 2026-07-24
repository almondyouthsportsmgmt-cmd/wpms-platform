create table if not exists public.kennels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone text not null,
  type text not null default 'Standard' check (type in ('Standard','Luxury','Cat Condo','Isolation','Daycare')),
  capacity integer not null default 1 check (capacity > 0),
  status text not null default 'Available' check (status in ('Available','Reserved','Occupied','Cleaning','Maintenance')),
  pet_id uuid references public.pets(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  check_in_date date,
  check_out_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(zone, name)
);

create index if not exists kennels_zone_idx on public.kennels(zone);
create index if not exists kennels_status_idx on public.kennels(status);
create index if not exists kennels_pet_idx on public.kennels(pet_id);

create or replace function public.set_kennels_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kennels_set_updated_at on public.kennels;
create trigger kennels_set_updated_at
before update on public.kennels
for each row execute function public.set_kennels_updated_at();

alter table public.kennels enable row level security;

drop policy if exists "Authenticated users manage kennels" on public.kennels;
create policy "Authenticated users manage kennels"
on public.kennels for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.kennels to authenticated;
