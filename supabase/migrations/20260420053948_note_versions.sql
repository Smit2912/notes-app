create table if not exists note_versions (
  id uuid primary key default gen_random_uuid(),

  note_id uuid not null
    references notes(id)
    on delete cascade,

  content text not null,

  created_by uuid
    references auth.users(id),

  created_at timestamptz default now()
);

create index if not exists idx_note_versions_note_id
on note_versions(note_id);

create index if not exists idx_note_versions_created_at
on note_versions(created_at desc);