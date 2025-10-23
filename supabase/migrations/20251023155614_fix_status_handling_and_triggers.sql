-- Ensure status column default is 'draft'
ALTER TABLE forms ALTER COLUMN status SET DEFAULT 'draft';

-- Create function for auto-updating timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_forms_timestamp ON forms;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_forms_timestamp
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Update any NULL status to 'draft'
UPDATE forms SET status = 'draft' WHERE status IS NULL;

-- Ensure status constraint includes all valid values
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_status_check;
ALTER TABLE forms ADD CONSTRAINT forms_status_check 
  CHECK (status IN ('draft', 'field', 'submitted', 'completed'));

COMMENT ON COLUMN forms.status IS 'Form status: draft/field (editable), submitted (legacy), completed (final/locked)';
