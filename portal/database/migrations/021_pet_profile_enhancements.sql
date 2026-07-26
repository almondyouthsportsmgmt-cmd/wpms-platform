alter table public.pets
  add column if not exists hair_length text not null default 'Short Coat',
  add column if not exists fixed_status text not null default 'Intact',
  add column if not exists preferred_shampoo text,
  add column if not exists avatar text not null default '🐕';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pets_hair_length_check'
      and conrelid = 'public.pets'::regclass
  ) then
    alter table public.pets
      add constraint pets_hair_length_check
      check (hair_length in ('Long Coat','Short Coat','Wire Coat'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pets_fixed_status_check'
      and conrelid = 'public.pets'::regclass
  ) then
    alter table public.pets
      add constraint pets_fixed_status_check
      check (fixed_status in ('Spayed (Female)','Neutered (Male)','Intact'));
  end if;
end $$;

update public.pets
set avatar = case when species = 'Cat' then '🐈' else '🐕' end
where avatar is null or trim(avatar) = '';
