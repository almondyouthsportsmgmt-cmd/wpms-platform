create table if not exists public.grooming_sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  groomer text,
  stage text not null default 'Checked In' check (stage in ('Checked In','Bath','Drying','Haircut','Nails','Finishing','Ready for Pickup','Picked Up')),
  check_in_at timestamptz,
  started_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  bath_complete boolean not null default false,
  drying_complete boolean not null default false,
  haircut_complete boolean not null default false,
  nails_complete boolean not null default false,
  ears_complete boolean not null default false,
  teeth_complete boolean not null default false,
  final_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists grooming_sessions_stage_idx on public.grooming_sessions(stage);
create index if not exists grooming_sessions_pet_idx on public.grooming_sessions(pet_id);
create or replace function public.set_grooming_sessions_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists grooming_sessions_set_updated_at on public.grooming_sessions;
create trigger grooming_sessions_set_updated_at before update on public.grooming_sessions for each row execute function public.set_grooming_sessions_updated_at();
alter table public.grooming_sessions enable row level security;
drop policy if exists "Authenticated users manage grooming sessions" on public.grooming_sessions;
create policy "Authenticated users manage grooming sessions" on public.grooming_sessions for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.grooming_sessions to authenticated;
