/*
  # Add Optimized Columns to Forms Table

  This migration adds the missing columns to support the optimized egress architecture.

  ## Changes
  1. Add filterable columns for efficient list queries:
     - `tasiyici_firma` - Carrier company name
     - `arac_turu` - Vehicle type
     - `cekici_plaka` - Tractor plate number
     - `genel_sonuc` - Overall result
  
  2. Add storage-related columns:
     - `pdf_path` - Storage path to final PDF (replaces pdf_url)
     - `photos` - Array of Storage paths for photos
     - `signature_path` - Storage path to signature image
     - `summary` - Small JSON for quick filtering
  
  3. Add indexes for performance:
     - created_at DESC for chronological queries
     - status for filtering
     - custom_status for UI filtering

  ## Notes
  - Existing `pdf_url` column remains for backward compatibility but new code uses `pdf_path`
  - All new columns are nullable to support existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'tasiyici_firma'
  ) THEN
    ALTER TABLE forms ADD COLUMN tasiyici_firma text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'arac_turu'
  ) THEN
    ALTER TABLE forms ADD COLUMN arac_turu text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'cekici_plaka'
  ) THEN
    ALTER TABLE forms ADD COLUMN cekici_plaka text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'genel_sonuc'
  ) THEN
    ALTER TABLE forms ADD COLUMN genel_sonuc text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'pdf_path'
  ) THEN
    ALTER TABLE forms ADD COLUMN pdf_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'photos'
  ) THEN
    ALTER TABLE forms ADD COLUMN photos jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'signature_path'
  ) THEN
    ALTER TABLE forms ADD COLUMN signature_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'summary'
  ) THEN
    ALTER TABLE forms ADD COLUMN summary jsonb DEFAULT '{}';
  END IF;
END $$;

COMMENT ON COLUMN forms.pdf_path IS 'Storage path to final PDF in forms bucket';
COMMENT ON COLUMN forms.photos IS 'Array of Storage paths to resized WebP photos';
COMMENT ON COLUMN forms.signature_path IS 'Storage path to signature image';
COMMENT ON COLUMN forms.summary IS 'Small JSON with filterable fields for efficient queries';

CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_custom_status ON forms(custom_status);

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('forms', 'forms', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view files in forms bucket'
  ) THEN
    CREATE POLICY "Anyone can view files in forms bucket"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'forms');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can upload files to forms bucket'
  ) THEN
    CREATE POLICY "Anyone can upload files to forms bucket"
      ON storage.objects
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'forms');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can update files in forms bucket'
  ) THEN
    CREATE POLICY "Anyone can update files in forms bucket"
      ON storage.objects
      FOR UPDATE
      TO anon, authenticated
      USING (bucket_id = 'forms');
  END IF;
END $$;
