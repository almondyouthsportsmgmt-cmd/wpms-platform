create table if not exists public.pet_timeline_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  event_type text not null check (event_type in ('Grooming','Boarding','Health','Photo','Note')),
  title text not null,
  description text,
  event_date date not null,
  before_photo_url text,
  after_photo_url text,
  report_card jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pet_timeline_pet_date_idx on public.pet_timeline_events(pet_id, event_date desc);
alter table public.pet_timeline_events enable row level security;
drop policy if exists "Authenticated users manage pet timeline" on public.pet_timeline_events;
create policy "Authenticated users manage pet timeline" on public.pet_timeline_events for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.pet_timeline_events to authenticated;
