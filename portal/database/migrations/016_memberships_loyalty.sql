create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  billing_frequency text not null check (billing_frequency in ('Monthly','Quarterly','Annual')),
  price numeric(10,2) not null check (price >= 0),
  grooming_discount_percent numeric(5,2) not null default 0,
  boarding_discount_percent numeric(5,2) not null default 0,
  included_nail_trims integer not null default 0,
  included_baths integer not null default 0,
  loyalty_points_multiplier numeric(5,2) not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  status text not null default 'Active' check (status in ('Active','Paused','Cancelled','Expired')),
  start_date date not null,
  renewal_date date not null,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_memberships_customer_idx on public.customer_memberships(customer_id);
create index if not exists customer_memberships_status_idx on public.customer_memberships(status);

alter table public.membership_plans enable row level security;
alter table public.customer_memberships enable row level security;
drop policy if exists "Authenticated users manage membership plans" on public.membership_plans;
create policy "Authenticated users manage membership plans" on public.membership_plans for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage customer memberships" on public.customer_memberships;
create policy "Authenticated users manage customer memberships" on public.customer_memberships for all to authenticated using (true) with check (true);
grant select,insert,update,delete on public.membership_plans to authenticated;
grant select,insert,update,delete on public.customer_memberships to authenticated;
