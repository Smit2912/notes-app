create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,

  owner_id uuid not null references auth.users(id) on delete cascade,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  version integer default 1
);

alter table notes
alter column owner_id set default auth.uid();