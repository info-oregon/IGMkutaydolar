@@ .. @@
 -- Create policies for companies
 CREATE POLICY "Users can read companies"
   ON companies
   FOR SELECT
-  TO authenticated
+  TO authenticated, anon
   USING (true);