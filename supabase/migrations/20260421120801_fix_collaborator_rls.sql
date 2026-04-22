-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "notes_select" ON notes;
DROP POLICY IF EXISTS "collab_select" ON note_collaborators;

-- 2. Create a "Bypass" function
-- This function runs with the privileges of the 'postgres' user (Security Definer)
-- It checks access without triggering an RLS loop.
CREATE OR REPLACE FUNCTION public.has_note_access(check_note_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.notes 
    WHERE id = check_note_id 
    AND (owner_id = check_user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.note_collaborators 
    WHERE note_id = check_note_id 
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply the new Notes Policy
CREATE POLICY "notes_select_v2"
ON notes FOR SELECT
TO authenticated
USING ( has_note_access(id, auth.uid()) );

-- 4. Apply the new Collaborators Policy
CREATE POLICY "collab_select_v2"
ON note_collaborators FOR SELECT
TO authenticated
USING ( 
    user_id = auth.uid() 
    OR 
    has_note_access(note_id, auth.uid()) 
);

-- 5. Ensure Realtime has enough data to work with
ALTER TABLE notes REPLICA IDENTITY FULL;
ALTER TABLE note_collaborators REPLICA IDENTITY FULL;