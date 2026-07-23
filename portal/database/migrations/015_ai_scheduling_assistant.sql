create table if not exists public.ai_scheduling_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  service_name text not null,
  preferred_date date not null,
  preferred_staff text,
  earliest_time time not null,
  latest_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  selected_date date not null,
  selected_start_time time not null,
  selected_end_time time not null,
  selected_staff text not null,
  recommendation_score integer not null check (recommendation_score between 1 and 99),
  recommendation_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'Pending Review' check (status in ('Pending Review','Approved','Rejected','Booked')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_scheduling_plans_date_idx on public.ai_scheduling_plans(preferred_date);
create index if not exists ai_scheduling_plans_status_idx on public.ai_scheduling_plans(status);
create index if not exists ai_scheduling_plans_pet_idx on public.ai_scheduling_plans(pet_id);

create or replace function public.set_ai_scheduling_plans_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_scheduling_plans_set_updated_at on public.ai_scheduling_plans;
create trigger ai_scheduling_plans_set_updated_at
before update on public.ai_scheduling_plans
for each row execute function public.set_ai_scheduling_plans_updated_at();

alter table public.ai_scheduling_plans enable row level security;

drop policy if exists "Authenticated users manage AI scheduling plans" on public.ai_scheduling_plans;
create policy "Authenticated users manage AI scheduling plans"
on public.ai_scheduling_plans for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.ai_scheduling_plans to authenticated;
