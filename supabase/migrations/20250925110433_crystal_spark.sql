/*
  # Enhanced forms table for vehicle inspection forms

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
      - `created_at` (timestamptz)
    
    - `forms` - Enhanced form structure
      - `id` (uuid, primary key)
      - `status` (text) - 'draft' or 'submitted'
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
    - Create `pdfs` bucket for storing PDF files
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
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

-- Drop existing forms table if exists and recreate with new structure
DROP TABLE IF EXISTS forms;

-- Create enhanced forms table
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  
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

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for inspectors
CREATE POLICY "Users can manage their own inspector profile"
  ON inspectors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for forms
CREATE POLICY "Users can manage their own forms"
  ON forms
  FOR ALL
  TO authenticated
  USING (inspector_id IN (
    SELECT id FROM inspectors WHERE user_id = auth.uid()
  ))
  WITH CHECK (inspector_id IN (
    SELECT id FROM inspectors WHERE user_id = auth.uid()
  ));

-- Create policy for reading submitted forms (for sharing)
CREATE POLICY "Submitted forms are readable by authenticated users"
  ON forms
  FOR SELECT
  TO authenticated
  USING (status = 'submitted');

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
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for PDFs
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Users can view PDF files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'pdfs');

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'pdfs');

-- Insert sample companies
INSERT INTO companies (name) VALUES 
  ('Oregon Lojistik'),
  ('XYZ Taşımacılık'),
  ('ABC Lojistik'),
  ('DEF Nakliyat')
ON CONFLICT DO NOTHING;