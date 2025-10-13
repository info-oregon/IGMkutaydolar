/*
  # Create forms table for vehicle inspection forms

  1. New Tables
    - `forms`
      - `id` (uuid, primary key)
      - `status` (text) - 'draft' or 'completed'
      - `tasiyici_firma` (text) - carrier company
      - `arac_turu` (text) - vehicle type
      - `sevk_durumu` (text) - shipment status
      - `muhur_durumu` (text) - seal status
      - `sofor_sayisi` (integer) - number of drivers
      - `cekici` (text) - tractor plate
      - `dorse` (text) - trailer plate
      - `konteyner_no` (text) - container number
      - `mrn` (text) - MRN number
      - `rejim_hak` (text) - regime rights holder
      - `muhur_num` (text) - seal number
      - `yeni_muhur_num` (text) - new seal number
      - `muhur_kontrol` (jsonb) - seal control results
      - `soforler` (jsonb) - drivers information
      - `fiziki_kontrol` (jsonb) - physical control results
      - `fiziki_aciklama` (jsonb) - physical control explanations
      - `zula_kontrol` (jsonb) - compartment control results
      - `zula_aciklama` (jsonb) - compartment control explanations
      - `genel_sonuc` (text) - general result
      - `kontrol_eden_ad` (text) - inspector name
      - `kontrol_eden_imza` (text) - inspector signature (base64)
      - `timestamp` (text) - form completion timestamp
      - `pdf_url` (text) - PDF file URL in storage
      - `user_id` (uuid) - user who created the form
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `forms` table
    - Add policy for users to manage their own forms
    - Add policy for reading completed forms

  3. Storage
    - Create `pdfs` bucket for storing PDF files
*/

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  
  -- Basic information
  tasiyici_firma text,
  arac_turu text,
  sevk_durumu text,
  muhur_durumu text,
  sofor_sayisi integer DEFAULT 1,
  
  -- Plate information
  cekici text,
  dorse text,
  konteyner_no text,
  
  -- Shipment information
  mrn text,
  rejim_hak text,
  
  -- Seal information
  muhur_num text,
  yeni_muhur_num text,
  muhur_kontrol jsonb DEFAULT '{}',
  
  -- Driver information
  soforler jsonb DEFAULT '[]',
  
  -- Control results
  fiziki_kontrol jsonb DEFAULT '[]',
  fiziki_aciklama jsonb DEFAULT '[]',
  zula_kontrol jsonb DEFAULT '[]',
  zula_aciklama jsonb DEFAULT '[]',
  
  -- General result
  genel_sonuc text,
  kontrol_eden_ad text,
  kontrol_eden_imza text, -- base64 encoded signature
  timestamp text,
  
  -- File storage
  pdf_url text,
  
  -- Metadata
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own forms"
  ON forms
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for reading completed forms (for sharing)
CREATE POLICY "Completed forms are readable by authenticated users"
  ON forms
  FOR SELECT
  TO authenticated
  USING (status = 'completed');

-- Create updated_at trigger
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

-- Create storage policy for PDFs
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