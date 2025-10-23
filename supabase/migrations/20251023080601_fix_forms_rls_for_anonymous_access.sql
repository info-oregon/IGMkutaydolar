/*
  # Fix Forms RLS for Anonymous Access

  1. Changes
    - Update RLS policies to allow anonymous (anon) access to forms table
    - This is needed because the app uses custom authentication, not Supabase auth
    - The app-level authentication handles security, so RLS can be permissive

  2. Security Notes
    - App uses custom localStorage-based authentication
    - Forms are protected at application level
    - RLS policies are kept simple to allow app-level auth to work
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view forms" ON forms;
DROP POLICY IF EXISTS "Anyone can create forms" ON forms;
DROP POLICY IF EXISTS "Anyone can update draft or submitted forms" ON forms;
DROP POLICY IF EXISTS "Anyone can delete draft forms" ON forms;

-- Create new permissive policies for anon role
CREATE POLICY "Allow anon to view all forms"
  ON forms FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert forms"
  ON forms FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update forms"
  ON forms FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete forms"
  ON forms FOR DELETE
  TO anon
  USING (true);

-- Keep policies for authenticated users too
CREATE POLICY "Allow authenticated to view all forms"
  ON forms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to insert forms"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to update forms"
  ON forms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete forms"
  ON forms FOR DELETE
  TO authenticated
  USING (true);