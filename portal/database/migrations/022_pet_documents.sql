create table if not exists public.pet_documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  document_name text not null,
  category text not null default 'Other',
  description text,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  storage_path text not null unique,
  expiration_date date,
  uploaded_by text not null default 'Staff',
  created_at timestamptz not null default now()
);

create index if not exists pet_documents_pet_idx
  on public.pet_documents(pet_id, created_at desc);

create index if not exists pet_documents_category_idx
  on public.pet_documents(category);

alter table public.pet_documents enable row level security;

drop policy if exists "Authenticated users manage pet documents"
  on public.pet_documents;

create policy "Authenticated users manage pet documents"
  on public.pet_documents
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete
  on public.pet_documents
  to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('pet-documents', 'pet-documents', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Authenticated users read pet document files"
  on storage.objects;

create policy "Authenticated users read pet document files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'pet-documents');

drop policy if exists "Authenticated users upload pet document files"
  on storage.objects;

create policy "Authenticated users upload pet document files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'pet-documents');

drop policy if exists "Authenticated users update pet document files"
  on storage.objects;

create policy "Authenticated users update pet document files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'pet-documents')
  with check (bucket_id = 'pet-documents');

drop policy if exists "Authenticated users delete pet document files"
  on storage.objects;

create policy "Authenticated users delete pet document files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'pet-documents');
