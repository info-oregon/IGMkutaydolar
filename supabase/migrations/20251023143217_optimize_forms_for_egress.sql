-- Add new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'pdf_size_bytes'
  ) THEN
    ALTER TABLE forms ADD COLUMN pdf_size_bytes int;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'thumbnail_path'
  ) THEN
    ALTER TABLE forms ADD COLUMN thumbnail_path text;
  END IF;
END $$;

-- Update status constraint to include field AND submitted
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_status_check;
ALTER TABLE forms ADD CONSTRAINT forms_status_check 
  CHECK (status IN ('draft', 'field', 'submitted', 'completed'));

COMMENT ON COLUMN forms.pdf_size_bytes IS 'Size of final PDF in bytes for monitoring';
COMMENT ON COLUMN forms.thumbnail_path IS 'Thumbnail image path for fast dashboard listing';
COMMENT ON COLUMN forms.status IS 'Status: draft/field (editable), submitted/completed (final, locked)';

-- Update RLS policies
DROP POLICY IF EXISTS "Sadece draft formlar güncellenebilir" ON forms;
DROP POLICY IF EXISTS "Anyone can update draft forms" ON forms;
DROP POLICY IF EXISTS "Draft and field forms can be updated" ON forms;

CREATE POLICY "Draft and field forms can be updated"
  ON forms FOR UPDATE
  TO anon, authenticated
  USING (status IN ('draft', 'field'))
  WITH CHECK (status IN ('draft', 'field', 'submitted', 'completed'));
