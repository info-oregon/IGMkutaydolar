/*
  # Lock Completed Forms from Editing

  ## Purpose
  Prevent editing or deletion of forms once they are submitted/completed.
  Only admin users can modify completed forms.

  ## Changes Made

  1. **Drop Permissive Policies**
     - Remove the current overly permissive UPDATE and DELETE policies
     - Replace with restrictive policies that check status

  2. **New UPDATE Policy**
     - Allow updates only for draft status forms
     - Admin users can update any form (future implementation)
     - Blocks updates to submitted/completed forms

  3. **New DELETE Policy**
     - Allow deletion only for draft status forms
     - Admin users can delete any form (future implementation)
     - Blocks deletion of submitted/completed forms

  ## Status Logic
  - `status='draft'` → Editable by anyone
  - `status='submitted'` → Read-only (locked)
  - Future: Add admin role check for overrides

  ## Migration Safety
  - Uses DROP POLICY IF EXISTS to prevent errors
  - Uses DO blocks with IF NOT EXISTS checks
  - Maintains backward compatibility
*/

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Allow updating forms" ON forms;

-- Drop the overly permissive DELETE policy
DROP POLICY IF EXISTS "Allow deleting forms" ON forms;

-- Create restrictive UPDATE policy: only draft forms can be updated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'forms' 
    AND policyname = 'Allow updating draft forms only'
  ) THEN
    CREATE POLICY "Allow updating draft forms only"
      ON forms
      FOR UPDATE
      TO authenticated, anon
      USING (status = 'draft')
      WITH CHECK (status = 'draft');
  END IF;
END $$;

-- Create restrictive DELETE policy: only draft forms can be deleted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'forms' 
    AND policyname = 'Allow deleting draft forms only'
  ) THEN
    CREATE POLICY "Allow deleting draft forms only"
      ON forms
      FOR DELETE
      TO authenticated, anon
      USING (status = 'draft');
  END IF;
END $$;

-- Add a comment to the status column explaining the lock behavior
COMMENT ON COLUMN forms.status IS 'Form status: draft (editable) or submitted (locked/read-only)';

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_forms_status_lock ON forms(status) WHERE status = 'draft';
