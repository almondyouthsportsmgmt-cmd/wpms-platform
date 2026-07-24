create table if not exists public.client_forms (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  form_type text not null check (form_type in ('Grooming Consent','Boarding Agreement','Medication Authorization','New Client Intake','Vaccination Waiver')),
  title text not null,
  status text not null default 'Draft' check (status in ('Draft','Sent','Signed','Declined','Expired')),
  sent_at timestamptz,
  signed_at timestamptz,
  expires_at timestamptz,
  signer_name text,
  signer_email text,
  signature_data text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_forms_customer_idx on public.client_forms(customer_id);
create index if not exists client_forms_pet_idx on public.client_forms(pet_id);
create index if not exists client_forms_status_idx on public.client_forms(status);
create index if not exists client_forms_expires_idx on public.client_forms(expires_at);

create or replace function public.set_client_forms_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists client_forms_set_updated_at on public.client_forms;
create trigger client_forms_set_updated_at before update on public.client_forms
for each row execute function public.set_client_forms_updated_at();

alter table public.client_forms enable row level security;

drop policy if exists "Authenticated users manage client forms" on public.client_forms;
create policy "Authenticated users manage client forms"
on public.client_forms for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.client_forms to authenticated;
