-- Step 1: Migrate existing data first (before constraints)
UPDATE forms
SET status = CASE
  WHEN custom_status IN ('field', 'draft') THEN 'draft'
  WHEN custom_status = 'completed' THEN 'completed'
  WHEN status = 'submitted' THEN 'completed'
  ELSE 'draft'
END;

-- Handle NULL custom_status
UPDATE forms
SET custom_status = 'draft'
WHERE custom_status IS NULL;

-- Step 2: Now add constraints
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_status_check;
ALTER TABLE forms ADD CONSTRAINT forms_status_check 
  CHECK (status IN ('draft', 'completed'));

ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_custom_status_check;
ALTER TABLE forms ADD CONSTRAINT forms_custom_status_check 
  CHECK (custom_status IN ('field', 'draft', 'completed'));

-- Step 3: Create function to auto-sync status based on custom_status
CREATE OR REPLACE FUNCTION sync_form_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_status IN ('field', 'draft') THEN
    NEW.status := 'draft';
  ELSIF NEW.custom_status = 'completed' THEN
    NEW.status := 'completed';
  ELSE
    NEW.status := 'draft';
    NEW.custom_status := 'draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Drop and recreate trigger
DROP TRIGGER IF EXISTS sync_form_status_trigger ON forms;

CREATE TRIGGER sync_form_status_trigger
  BEFORE INSERT OR UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION sync_form_status();

-- Step 5: Update column comments
COMMENT ON COLUMN forms.status IS 'Base status: draft (editable) or completed (locked). Auto-synced from custom_status via trigger.';
COMMENT ON COLUMN forms.custom_status IS 'UI filter category: field, draft, or completed. Determines dashboard tab and auto-syncs status.';

-- Step 6: Update RLS policies
DROP POLICY IF EXISTS "Draft and field forms can be updated" ON forms;
DROP POLICY IF EXISTS "Completed forms are locked" ON forms;

CREATE POLICY "Draft forms can be updated"
  ON forms FOR UPDATE
  TO anon, authenticated
  USING (status = 'draft')
  WITH CHECK (true);

CREATE POLICY "Completed forms cannot be updated"
  ON forms FOR UPDATE
  TO anon, authenticated
  USING (status != 'completed')
  WITH CHECK (true);
