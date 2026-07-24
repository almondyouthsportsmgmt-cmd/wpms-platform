create table if not exists public.automated_reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  reminder_type text not null check (reminder_type in (
    'Appointment Confirmation','Appointment Reminder','Boarding Check-In','Boarding Check-Out',
    'Vaccination Expiration','Payment Follow-Up','Membership Renewal','We Miss You'
  )),
  channel text not null default 'SMS' check (channel in ('SMS','Email','Both')),
  subject text,
  message text not null check (length(trim(message)) > 0),
  scheduled_for timestamptz not null,
  status text not null default 'Scheduled' check (status in ('Scheduled','Sent','Skipped','Failed','Cancelled')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automated_reminders_scheduled_idx on public.automated_reminders(scheduled_for, status);
create index if not exists automated_reminders_customer_idx on public.automated_reminders(customer_id);
create index if not exists automated_reminders_pet_idx on public.automated_reminders(pet_id);

create or replace function public.set_automated_reminders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists automated_reminders_set_updated_at on public.automated_reminders;
create trigger automated_reminders_set_updated_at
before update on public.automated_reminders
for each row execute function public.set_automated_reminders_updated_at();

alter table public.automated_reminders enable row level security;

drop policy if exists "Authenticated users manage automated reminders" on public.automated_reminders;
create policy "Authenticated users manage automated reminders"
on public.automated_reminders for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.automated_reminders to authenticated;
