-- Add resolution tracking to notes table
ALTER TABLE notes 
ADD COLUMN last_resolved_by uuid REFERENCES auth.users(id),
ADD COLUMN last_resolved_at timestamp with time zone;
