create table if not exists public.crm_profiles (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null unique references public.customers(id) on delete cascade,
 segment text not null default 'New' check(segment in ('VIP','Loyal','New','At Risk','Dormant','Prospect')),
 lifetime_value numeric(12,2) not null default 0,total_visits integer not null default 0,grooming_visits integer not null default 0,boarding_visits integer not null default 0,
 last_visit_at timestamptz,next_recommended_visit timestamptz,referral_source text,tags text[] not null default '{}',internal_notes text,is_vip boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.marketing_campaigns (
 id uuid primary key default gen_random_uuid(),name text not null,channel text not null check(channel in ('Email','SMS','Both')),status text not null default 'Draft' check(status in ('Draft','Scheduled','Active','Completed','Cancelled')),
 audience_segment text not null default 'All Customers',subject text,message text not null,scheduled_at timestamptz,sent_count integer not null default 0,opened_count integer not null default 0,clicked_count integer not null default 0,converted_count integer not null default 0,revenue_attributed numeric(12,2) not null default 0,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.crm_leads (
 id uuid primary key default gen_random_uuid(),first_name text not null,last_name text not null,email text,mobile_phone text,source text,status text not null default 'New' check(status in ('New','Contacted','Qualified','Converted','Lost')),notes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists crm_profiles_segment_idx on public.crm_profiles(segment);create index if not exists crm_profiles_ltv_idx on public.crm_profiles(lifetime_value desc);create index if not exists marketing_campaigns_status_idx on public.marketing_campaigns(status);create index if not exists crm_leads_status_idx on public.crm_leads(status);
create or replace function public.wpms_set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end;$$;
drop trigger if exists crm_profiles_set_updated_at on public.crm_profiles;create trigger crm_profiles_set_updated_at before update on public.crm_profiles for each row execute function public.wpms_set_updated_at();
drop trigger if exists marketing_campaigns_set_updated_at on public.marketing_campaigns;create trigger marketing_campaigns_set_updated_at before update on public.marketing_campaigns for each row execute function public.wpms_set_updated_at();
drop trigger if exists crm_leads_set_updated_at on public.crm_leads;create trigger crm_leads_set_updated_at before update on public.crm_leads for each row execute function public.wpms_set_updated_at();
alter table public.crm_profiles enable row level security;alter table public.marketing_campaigns enable row level security;alter table public.crm_leads enable row level security;
drop policy if exists "Authenticated users manage CRM profiles" on public.crm_profiles;create policy "Authenticated users manage CRM profiles" on public.crm_profiles for all to authenticated using(true) with check(true);
drop policy if exists "Authenticated users manage campaigns" on public.marketing_campaigns;create policy "Authenticated users manage campaigns" on public.marketing_campaigns for all to authenticated using(true) with check(true);
drop policy if exists "Authenticated users manage CRM leads" on public.crm_leads;create policy "Authenticated users manage CRM leads" on public.crm_leads for all to authenticated using(true) with check(true);
grant select,insert,update,delete on public.crm_profiles,public.marketing_campaigns,public.crm_leads to authenticated;
