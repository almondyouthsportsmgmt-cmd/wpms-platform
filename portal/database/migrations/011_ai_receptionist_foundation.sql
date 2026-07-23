create table if not exists public.ai_receptionist_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  channel text not null default 'Web Chat' check (channel in ('Web Chat','SMS','Phone Note')),
  intent text not null default 'General Question',
  summary text,
  last_message text not null,
  last_message_at timestamptz not null default now(),
  status text not null default 'Open' check (status in ('Open','Resolved','Escalated')),
  assigned_to text not null default 'AI Receptionist',
  ai_confidence numeric(5,4),
  suggested_reply text,
  suggested_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_receptionist_status_idx on public.ai_receptionist_conversations(status);
create index if not exists ai_receptionist_intent_idx on public.ai_receptionist_conversations(intent);
create index if not exists ai_receptionist_last_message_idx on public.ai_receptionist_conversations(last_message_at desc);

create or replace function public.set_ai_receptionist_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_receptionist_set_updated_at on public.ai_receptionist_conversations;
create trigger ai_receptionist_set_updated_at
before update on public.ai_receptionist_conversations
for each row execute function public.set_ai_receptionist_updated_at();

alter table public.ai_receptionist_conversations enable row level security;

drop policy if exists "Authenticated users manage AI receptionist conversations" on public.ai_receptionist_conversations;
create policy "Authenticated users manage AI receptionist conversations"
on public.ai_receptionist_conversations for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.ai_receptionist_conversations to authenticated;
