create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('Client Portal','Website')),
  status text not null default 'Pending Review' check (status in ('Pending Review','Approved','Declined')),
  customer_id uuid references public.customers(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  requester_name text,
  requester_phone text,
  requester_email text,
  appointment_type text not null,
  service_id uuid,
  service_name text not null,
  requested_date date not null,
  requested_start_time time not null,
  requested_end_time time not null,
  preferred_staff text,
  price_estimate numeric(10,2),
  notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  appointment_id uuid references public.appointments(id) on delete set null
);
create index if not exists appointment_requests_status_idx on public.appointment_requests(status, submitted_at desc);
alter table public.appointment_requests enable row level security;
create policy "authenticated appointment requests access" on public.appointment_requests for all to authenticated using (true) with check (true);
