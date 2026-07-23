create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  subject text not null default 'Customer conversation',
  last_message_at timestamptz not null default now(),
  unread_count integer not null default 0 check (unread_count >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  direction text not null check (direction in ('Inbound','Outbound')),
  body text not null check (length(trim(body)) > 0),
  status text not null default 'Sent' check (status in ('Sent','Delivered','Failed','Received')),
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists message_threads_customer_idx on public.message_threads(customer_id);
create index if not exists message_threads_last_message_idx on public.message_threads(last_message_at desc);
create index if not exists messages_thread_idx on public.messages(thread_id,sent_at);
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
drop policy if exists "Authenticated users manage message threads" on public.message_threads;
create policy "Authenticated users manage message threads" on public.message_threads for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage messages" on public.messages;
create policy "Authenticated users manage messages" on public.messages for all to authenticated using (true) with check (true);
grant select,insert,update,delete on public.message_threads to authenticated;
grant select,insert,update,delete on public.messages to authenticated;
