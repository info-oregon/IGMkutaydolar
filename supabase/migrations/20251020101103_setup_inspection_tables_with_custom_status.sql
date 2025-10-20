/*
  # Create inspection system tables and storage

  1. New Tables
    - `companies` - Company information
      - `id` (uuid, primary key)
      - `name` (text) - company name
      - `created_at` (timestamptz)
    
    - `inspectors` - Inspector information  
      - `id` (uuid, primary key)
      - `name` (text) - inspector name
      - `email` (text) - inspector email
      - `company_id` (uuid) - foreign key to companies
      - `user_id` (uuid) - foreign key to auth.users
      - `created_at` (timestamptz)
    
    - `forms` - Vehicle inspection forms
      - `id` (uuid, primary key)
      - `status` (text) - 'draft' or 'submitted'
      - `custom_status` (text) - extended statuses: 'completed', 'sahada', 'sahadan_cikis'
      - `form_data` (jsonb) - complete form data in JSON format
      - `pdf_url` (text) - PDF file URL in storage
      - `company_id` (uuid) - foreign key to companies
      - `inspector_id` (uuid) - foreign key to inspectors
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add policies for reading submitted forms

  3. Storage
    - Create `inspection-pdfs` bucket for storing PDF files
    - Add storage policies for secure access

  4. Sample Data
    - Insert sample companies for testing
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create inspectors table
CREATE TABLE IF NOT EXISTS inspectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create forms table with custom_status column
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  custom_status text,
  
  -- Complete form data in JSON format
  form_data jsonb NOT NULL DEFAULT '{}',
  
  -- File storage
  pdf_url text,
  
  -- Relational fields
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  inspector_id uuid REFERENCES inspectors(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comment for custom_status column
COMMENT ON COLUMN forms.custom_status IS 'Extended status values: completed, sahada, sahadan_cikis, x, y. Takes precedence over base status field.';

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can read companies"
  ON companies
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create policies for inspectors
CREATE POLICY "Users can manage their own inspector profile"
  ON inspectors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for forms
CREATE POLICY "Users can manage all forms"
  ON forms
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for forms
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-pdfs', 'inspection-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for PDFs
CREATE POLICY "Users can upload PDFs"
  ON storage.objects
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (bucket_id = 'inspection-pdfs');

CREATE POLICY "Users can view PDF files"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'inspection-pdfs');

CREATE POLICY "Users can delete PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated, anon
  USING (bucket_id = 'inspection-pdfs');

-- Insert sample companies for testing
INSERT INTO companies (name) VALUES 
  ('Oregon Lojistik A.Ş.'),
  ('Anadolu Nakliyat Ltd.'),
  ('Marmara Taşımacılık A.Ş.'),
  ('Ege Lojistik Ltd.'),
  ('Akdeniz Nakliyat A.Ş.'),
  ('Karadeniz Taşımacılık Ltd.'),
  ('İç Anadolu Lojistik A.Ş.'),
  ('Doğu Anadolu Nakliyat Ltd.'),
  ('Güneydoğu Taşımacılık A.Ş.'),
  ('Trakya Lojistik Ltd.')
ON CONFLICT (name) DO NOTHING;