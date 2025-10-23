/*
  # Create forms table with storage support

  ## New Tables
  - `forms`
    - `id` (uuid, primary key) - Unique form identifier
    - `status` (text, not null) - Form status: 'draft' or 'submitted'
    - `custom_status` (text, nullable) - Custom Turkish status: 'taslak' or 'sahada'
    - `created_at` (timestamptz) - Form creation timestamp
    - `updated_at` (timestamptz, nullable) - Last update timestamp
    - `tasiyici_firma` (text, nullable) - Carrier company name
    - `arac_turu` (text, nullable) - Vehicle type
    - `cekici_plaka` (text, nullable) - Tractor plate number
    - `genel_sonuc` (text, nullable) - Overall result
    - `pdf_path` (text, nullable) - Storage path to final PDF
    - `photos` (jsonb, nullable) - Array of Storage paths for photos
    - `signature_path` (text, nullable) - Storage path to signature image
    - `summary` (jsonb, nullable) - Small filterable fields for quick queries

  ## Indexes
  - Index on `created_at` for chronological queries
  - Index on `status` for filtering by submission status
  - Index on `custom_status` for filtering by Turkish custom status

  ## Security (RLS)
  - Enable Row Level Security on forms table
  - Public can select all forms (read-only access for viewing)
  - Public can insert draft forms (anonymous form creation)
  - Public can update draft forms (editing before submission)
  - Deny update on submitted forms (immutable after submission)
  - Deny delete operations (forms are permanent records)

  ## Storage Buckets
  - Create 'forms' bucket for storing PDFs, photos, and signatures
  - Enable public access for signed URLs
*/

CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  custom_status text CHECK (custom_status IN ('taslak', 'sahada')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  tasiyici_firma text,
  arac_turu text,
  cekici_plaka text,
  genel_sonuc text,
  pdf_path text,
  photos jsonb,
  signature_path text,
  summary jsonb
);

CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_custom_status ON forms(custom_status);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view all forms"
  ON forms
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert draft forms"
  ON forms
  FOR INSERT
  WITH CHECK (status = 'draft');

CREATE POLICY "Public can update draft forms"
  ON forms
  FOR UPDATE
  USING (status = 'draft')
  WITH CHECK (status IN ('draft', 'submitted'));

CREATE POLICY "Deny delete operations"
  ON forms
  FOR DELETE
  USING (false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('forms', 'forms', true)
ON CONFLICT (id) DO NOTHING;
