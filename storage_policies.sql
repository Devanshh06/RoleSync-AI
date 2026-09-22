-- Run this in your Supabase SQL Editor to allow file uploads to the storage bucket.
-- When you made the bucket "Public" in the dashboard, it only allowed "Reads" (SELECT).
-- This script adds the policies to allow "Uploads" (INSERT) and "Deletes" (DELETE).

CREATE POLICY "Allow public uploads to vault-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'vault-documents');

CREATE POLICY "Allow public updates to vault-documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'vault-documents');

CREATE POLICY "Allow public deletes from vault-documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'vault-documents');



