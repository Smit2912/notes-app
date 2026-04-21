create table note_collaborators (
  id uuid primary key default gen_random_uuid(),

  note_id uuid references notes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,

  role text check (role in ('viewer', 'editor')) default 'viewer',

  created_at timestamp with time zone default now(),

  unique (note_id, user_id)
);