-- Clean FK setup (final version)

-- Remove bad/duplicate constraints
ALTER TABLE note_collaborators
DROP CONSTRAINT IF EXISTS fk_note;

ALTER TABLE note_collaborators
DROP CONSTRAINT IF EXISTS fk_user;

-- Ensure note_id FK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'note_collaborators_note_id_fkey'
  ) THEN
    ALTER TABLE note_collaborators
    ADD CONSTRAINT note_collaborators_note_id_fkey
    FOREIGN KEY (note_id)
    REFERENCES notes(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure user_id FK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_collab_profile'
  ) THEN
    ALTER TABLE note_collaborators
    ADD CONSTRAINT fk_collab_profile
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;