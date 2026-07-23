create table if not exists public.customer_portal_access (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'Invited' check (status in ('Invited','Active','Suspended')),
  invited_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_portal_access_status_idx on public.customer_portal_access(status);
create index if not exists customer_portal_access_email_idx on public.customer_portal_access(lower(email));

create or replace function public.set_customer_portal_access_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_portal_access_set_updated_at on public.customer_portal_access;
create trigger customer_portal_access_set_updated_at
before update on public.customer_portal_access
for each row execute function public.set_customer_portal_access_updated_at();

alter table public.customer_portal_access enable row level security;

drop policy if exists "Authenticated staff manage customer portal access" on public.customer_portal_access;
create policy "Authenticated staff manage customer portal access"
on public.customer_portal_access for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.customer_portal_access to authenticated;
