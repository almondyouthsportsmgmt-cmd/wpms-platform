create table if not exists public.boarding_stays (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  check_in_date date not null,
  check_in_time time not null,
  check_out_date date not null,
  check_out_time time not null,
  kennel_name text,
  status text not null default 'Reserved' check (status in ('Reserved','Checked In','In Stay','Ready for Checkout','Checked Out','Cancelled')),
  feeding_frequency text not null default 'Twice Daily' check (feeding_frequency in ('Once Daily','Twice Daily','Three Times Daily','Custom')),
  food_instructions text,
  medication_instructions text,
  walk_instructions text,
  playtime_instructions text,
  emergency_notes text,
  belongings text,
  daily_rate numeric(10,2) not null default 0 check (daily_rate >= 0),
  deposit_amount numeric(10,2) not null default 0 check (deposit_amount >= 0),
  photo_updates_enabled boolean not null default true,
  veterinarian_release_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boarding_valid_dates check (
    check_out_date > check_in_date
    or (check_out_date = check_in_date and check_out_time > check_in_time)
  )
);

create index if not exists boarding_stays_dates_idx on public.boarding_stays(check_in_date, check_out_date);
create index if not exists boarding_stays_status_idx on public.boarding_stays(status);
create index if not exists boarding_stays_customer_idx on public.boarding_stays(customer_id);
create index if not exists boarding_stays_pet_idx on public.boarding_stays(pet_id);

create or replace function public.set_boarding_stays_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boarding_stays_set_updated_at on public.boarding_stays;
create trigger boarding_stays_set_updated_at
before update on public.boarding_stays
for each row execute function public.set_boarding_stays_updated_at();

alter table public.boarding_stays enable row level security;

drop policy if exists "Authenticated users manage boarding stays" on public.boarding_stays;
create policy "Authenticated users manage boarding stays"
on public.boarding_stays for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.boarding_stays to authenticated;
