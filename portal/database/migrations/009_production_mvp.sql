create table if not exists public.inventory_items (
 id uuid primary key default gen_random_uuid(), name text not null, sku text not null unique,
 barcode text, category text not null default 'Other', vendor text,
 quantity_on_hand numeric(12,2) not null default 0 check(quantity_on_hand>=0),
 reorder_level numeric(12,2) not null default 0 check(reorder_level>=0),
 unit_cost numeric(12,2) not null default 0 check(unit_cost>=0),
 retail_price numeric(12,2) not null default 0 check(retail_price>=0),
 status text not null default 'Active' check(status in ('Active','Inactive')),
 notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists inventory_items_name_idx on public.inventory_items(name);
create index if not exists inventory_items_low_stock_idx on public.inventory_items(quantity_on_hand,reorder_level);
alter table public.inventory_items enable row level security;
drop policy if exists "Authenticated users manage inventory" on public.inventory_items;
create policy "Authenticated users manage inventory" on public.inventory_items for all to authenticated using(true) with check(true);
grant select,insert,update,delete on public.inventory_items to authenticated;
