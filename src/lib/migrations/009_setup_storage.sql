-- 1. PROVISION BUCKET (Safe to run if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. DROP EXISTING POLICIES (To avoid errors if you run this twice)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Delete" ON storage.objects;

-- 3. CREATE POLICIES

-- Allow Public Read Access (SELECT)
-- This allows your app to display the images to anyone
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'question-images' );

-- Allow Authenticated Uploads (INSERT)
-- This allows logged-in admins to upload files
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'question-images' );

-- Allow Admins to Update/Delete (ALL)
-- This allows cleanup or replacing images
CREATE POLICY "Admin Update Delete"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'question-images' )
WITH CHECK ( bucket_id = 'question-images' );
