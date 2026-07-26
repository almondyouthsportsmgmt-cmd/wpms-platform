alter table public.kennels
  add column if not exists price numeric(10,2) not null default 0
  check (price >= 0);

create table if not exists public.kennel_pet_assignments (
  kennel_id uuid not null references public.kennels(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kennel_id, pet_id)
);

create index if not exists kennel_pet_assignments_pet_idx
  on public.kennel_pet_assignments(pet_id);

alter table public.kennel_pet_assignments enable row level security;

drop policy if exists "Authenticated users manage kennel pet assignments"
  on public.kennel_pet_assignments;

create policy "Authenticated users manage kennel pet assignments"
  on public.kennel_pet_assignments
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete
  on public.kennel_pet_assignments
  to authenticated;

insert into public.kennel_pet_assignments (kennel_id, pet_id)
select id, pet_id
from public.kennels
where pet_id is not null
on conflict do nothing;
