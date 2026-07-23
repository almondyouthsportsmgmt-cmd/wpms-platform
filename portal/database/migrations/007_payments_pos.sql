create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  lines jsonb not null default '[]'::jsonb,
  discount_type text not null default 'None' check (discount_type in ('None','Fixed','Percent')),
  discount_value numeric(10,2) not null default 0 check (discount_value >= 0),
  tax_rate numeric(6,3) not null default 0 check (tax_rate >= 0),
  tip_amount numeric(10,2) not null default 0 check (tip_amount >= 0),
  deposit_applied numeric(10,2) not null default 0 check (deposit_applied >= 0),
  payments jsonb not null default '[]'::jsonb,
  status text not null default 'Open' check (status in ('Open','Partially Paid','Paid','Voided')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_customer_idx on public.invoices(customer_id);
create index if not exists invoices_status_idx on public.invoices(status);
alter table public.invoices enable row level security;
drop policy if exists "Authenticated users manage invoices" on public.invoices;
create policy "Authenticated users manage invoices" on public.invoices for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.invoices to authenticated;

create or replace function public.wpms_record_payment(p_invoice_id uuid,p_amount numeric,p_method text,p_reference text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_invoice public.invoices; v_payment jsonb; v_paid numeric; v_total numeric; v_status text;
begin
  if p_amount <= 0 then raise exception 'Payment amount must be greater than zero.'; end if;
  select * into v_invoice from public.invoices where id=p_invoice_id for update;
  if not found then raise exception 'Invoice not found.'; end if;
  v_payment=jsonb_build_object('id',gen_random_uuid(),'invoiceId',p_invoice_id,'amount',p_amount,'method',p_method,'reference',coalesce(p_reference,''),'paidAt',now());
  v_paid=coalesce((select sum((x->>'amount')::numeric) from jsonb_array_elements(v_invoice.payments||jsonb_build_array(v_payment)) x),0);
  v_total=coalesce((select sum((x->>'quantity')::numeric*(x->>'unitPrice')::numeric) from jsonb_array_elements(v_invoice.lines) x),0);
  v_total=greatest(0,v_total-case when v_invoice.discount_type='Fixed' then v_invoice.discount_value when v_invoice.discount_type='Percent' then v_total*v_invoice.discount_value/100 else 0 end);
  v_total=v_total+(v_total*v_invoice.tax_rate/100)+v_invoice.tip_amount-v_invoice.deposit_applied;
  v_status=case when v_paid>=v_total then 'Paid' when v_paid>0 then 'Partially Paid' else 'Open' end;
  update public.invoices set payments=payments||jsonb_build_array(v_payment),status=v_status,updated_at=now() where id=p_invoice_id;
  return p_invoice_id;
end;$$;
grant execute on function public.wpms_record_payment(uuid,numeric,text,text) to authenticated;
