create table if not exists public.sms_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'Demo' check (provider in ('Demo','Android Bridge','Twilio','Telnyx')),
  business_number text not null default '',
  bridge_device_name text,
  bridge_endpoint text,
  inbound_webhook_secret text,
  auto_reply_enabled boolean not null default true,
  appointment_reminders_enabled boolean not null default true,
  boarding_updates_enabled boolean not null default true,
  grooming_ready_enabled boolean not null default true,
  quiet_hours_start time not null default '20:00',
  quiet_hours_end time not null default '07:00',
  connection_status text not null default 'Disconnected' check (connection_status in ('Disconnected','Connecting','Connected','Error')),
  last_connection_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_delivery_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  provider text not null,
  provider_message_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sms_delivery_events_message_idx on public.sms_delivery_events(message_id, created_at desc);

create or replace function public.set_sms_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sms_settings_set_updated_at on public.sms_settings;
create trigger sms_settings_set_updated_at
before update on public.sms_settings
for each row execute function public.set_sms_settings_updated_at();

alter table public.sms_settings enable row level security;
alter table public.sms_delivery_events enable row level security;

drop policy if exists "Authenticated users manage sms settings" on public.sms_settings;
create policy "Authenticated users manage sms settings"
on public.sms_settings for all to authenticated
using (true) with check (true);

drop policy if exists "Authenticated users view sms delivery events" on public.sms_delivery_events;
create policy "Authenticated users view sms delivery events"
on public.sms_delivery_events for select to authenticated
using (true);

grant select, insert, update, delete on public.sms_settings to authenticated;
grant select on public.sms_delivery_events to authenticated;
