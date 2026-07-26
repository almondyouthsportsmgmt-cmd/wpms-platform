-- ==========================================================
-- WPMS Scheduling Engine
-- Migration: 025_scheduling_engine.sql
-- ==========================================================

create extension if not exists pgcrypto;

-- ==========================================================
-- Resource Types
-- ==========================================================

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'schedule_resource_type'
    ) then
        create type schedule_resource_type as enum
        (
            'groomer',
            'grooming-table',
            'kennel',
            'employee',
            'room',
            'equipment'
        );
    end if;
end
$$;

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'schedule_event_type'
    ) then
        create type schedule_event_type as enum
        (
            'grooming',
            'boarding',
            'boarding-checkin',
            'boarding-checkout',
            'maintenance',
            'employee-pto',
            'blocked',
            'holiday'
        );
    end if;
end
$$;

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'schedule_status'
    ) then
        create type schedule_status as enum
        (
            'pending',
            'confirmed',
            'checked-in',
            'completed',
            'cancelled'
        );
    end if;
end
$$;

-- ==========================================================
-- Schedule Events
-- ==========================================================

create table if not exists public.schedule_events
(
    id uuid primary key default gen_random_uuid(),

    event_type schedule_event_type not null,

    status schedule_status not null default 'confirmed',

    title text not null,

    customer_id uuid,

    reference_id uuid,

    starts_at timestamptz not null,

    ends_at timestamptz not null,

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint schedule_events_time_check
        check (ends_at > starts_at)
);

create index if not exists idx_schedule_events_start
on public.schedule_events(starts_at);

create index if not exists idx_schedule_events_end
on public.schedule_events(ends_at);

create index if not exists idx_schedule_events_customer
on public.schedule_events(customer_id);

-- ==========================================================
-- Resources
-- ==========================================================

create table if not exists public.schedule_resources
(
    id uuid primary key default gen_random_uuid(),

    resource_type schedule_resource_type not null,

    resource_name text not null,

    active boolean not null default true,

    created_at timestamptz not null default now()
);

create index if not exists idx_schedule_resources_type
on public.schedule_resources(resource_type);

-- ==========================================================
-- Event Resources
-- Many-to-Many
-- ==========================================================

create table if not exists public.schedule_event_resources
(
    event_id uuid not null
        references public.schedule_events(id)
        on delete cascade,

    resource_id uuid not null
        references public.schedule_resources(id)
        on delete cascade,

    primary key
    (
        event_id,
        resource_id
    )
);

create index if not exists idx_schedule_event_resources_resource
on public.schedule_event_resources(resource_id);

-- ==========================================================
-- Pets assigned to schedule event
-- Allows shared boarding
-- ==========================================================

create table if not exists public.schedule_event_pets
(
    event_id uuid not null
        references public.schedule_events(id)
        on delete cascade,

    pet_id uuid not null
        references public.pets(id)
        on delete cascade,

    primary key
    (
        event_id,
        pet_id
    )
);

create index if not exists idx_schedule_event_pets_pet
on public.schedule_event_pets(pet_id);

-- ==========================================================
-- Temporary Resource Locks
-- Prevent double booking
-- ==========================================================

create table if not exists public.resource_locks
(
    id uuid primary key default gen_random_uuid(),

    resource_id uuid not null
        references public.schedule_resources(id)
        on delete cascade,

    employee_id uuid,

    event_id uuid,

    starts_at timestamptz not null,

    ends_at timestamptz not null,

    expires_at timestamptz not null,

    created_at timestamptz not null default now()
);

create index if not exists idx_resource_locks_resource
on public.resource_locks(resource_id);

create index if not exists idx_resource_locks_expire
on public.resource_locks(expires_at);

-- ==========================================================
-- Trigger
-- ==========================================================

create or replace function public.schedule_touch_updated_at()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_schedule_events_updated
on public.schedule_events;

create trigger trg_schedule_events_updated
before update
on public.schedule_events
for each row
execute procedure public.schedule_touch_updated_at();

-- ==========================================================
-- RLS
-- ==========================================================

alter table public.schedule_events
enable row level security;

alter table public.schedule_resources
enable row level security;

alter table public.schedule_event_resources
enable row level security;

alter table public.schedule_event_pets
enable row level security;

alter table public.resource_locks
enable row level security;

-- ==========================================================
-- Policies
-- ==========================================================

drop policy if exists
"Authenticated schedule events"
on public.schedule_events;

create policy
"Authenticated schedule events"
on public.schedule_events
for all
to authenticated
using (true)
with check (true);

drop policy if exists
"Authenticated schedule resources"
on public.schedule_resources;

create policy
"Authenticated schedule resources"
on public.schedule_resources
for all
to authenticated
using (true)
with check (true);

drop policy if exists
"Authenticated schedule event resources"
on public.schedule_event_resources;

create policy
"Authenticated schedule event resources"
on public.schedule_event_resources
for all
to authenticated
using (true)
with check (true);

drop policy if exists
"Authenticated schedule event pets"
on public.schedule_event_pets;

create policy
"Authenticated schedule event pets"
on public.schedule_event_pets
for all
to authenticated
using (true)
with check (true);

drop policy if exists
"Authenticated resource locks"
on public.resource_locks;

create policy
"Authenticated resource locks"
on public.resource_locks
for all
to authenticated
using (true)
with check (true);

-- ==========================================================
-- Grants
-- ==========================================================

grant select, insert, update, delete
on public.schedule_events
to authenticated;

grant select, insert, update, delete
on public.schedule_resources
to authenticated;

grant select, insert, update, delete
on public.schedule_event_resources
to authenticated;

grant select, insert, update, delete
on public.schedule_event_pets
to authenticated;

grant select, insert, update, delete
on public.resource_locks
to authenticated;

-- ==========================================================
-- Default Resources
-- ==========================================================

insert into public.schedule_resources
(
    resource_type,
    resource_name
)
values
('grooming-table','Table 1'),
('grooming-table','Table 2'),
('grooming-table','Table 3')
on conflict do nothing;