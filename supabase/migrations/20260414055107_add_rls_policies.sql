-- =========================
-- NOTES TABLE
-- =========================
alter table notes enable row level security;

-- SELECT: owner OR collaborator
create policy "notes_select"
on notes
for select
using (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1
    FROM note_collaborators nc
    WHERE nc.note_id = notes.id
      AND nc.user_id = auth.uid()
  )
);

-- INSERT: user can only create their own note
create policy "notes_insert"
on notes
for insert
with check (
  auth.uid() = owner_id
);

-- UPDATE: owner OR editor collaborator
create policy "notes_update"
on notes
for update
using (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1
    FROM note_collaborators nc
    WHERE nc.note_id = notes.id
      AND nc.user_id = auth.uid()
      AND nc.role = 'editor'
  )
);

-- DELETE: only owner
create policy "notes_delete"
on notes
for delete
using (
  auth.uid() = owner_id
);


-- =========================
-- NOTE COLLABORATORS TABLE
-- =========================
alter table note_collaborators enable row level security;

-- SELECT: user can only see their own collaborator rows
create policy "collab_select"
on note_collaborators
for select
using (
  user_id = auth.uid()
);

-- INSERT: only allow inserting YOUR OWN row
-- (real ownership validation happens in Edge Function)
create policy "collab_insert"
on note_collaborators
for insert
with check (
  auth.uid() = user_id
);

-- UPDATE: user can only update their own row
create policy "collab_update"
on note_collaborators
for update
using (user_id = auth.uid());

-- DELETE: user can remove themselves
create policy "collab_delete"
on note_collaborators
for delete
using (
  user_id = auth.uid()
);


-- =========================
-- TRIGGER (SAFE)
-- =========================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$ language plpgsql;

create trigger update_notes_updated_at
before update on notes
for each row
execute function update_updated_at();