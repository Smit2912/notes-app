create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamp with time zone default now()
);
