
-- Policies for 'avatars' bucket

-- Allow authenticated users to upload to their own folder (e.g., user_id/avatar.png)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
bucket_id = 'avatars' AND
auth.uid() IS NOT NULL AND -- Ensure user is authenticated
(storage.foldername(name))[1] = auth.uid()::text -- Files must be in a folder named after the user_id
-- Example: avatar_user_actual_id_filename.png -> (storage.foldername(name))[1] will be avatar_user_actual_id_filename.png, which won't work
-- Need to ensure name format is like: user-uuid/avatar.png
-- To enforce uploads into a user-specific folder: (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
-- AND name \~ '^' || auth.uid()::text || '/.\*' -- Alternative check for path prefix
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Authenticated users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated USING (
bucket_id = 'avatars' AND
auth.uid() IS NOT NULL AND
(storage.foldername(name))[1] = auth.uid()::text
-- (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow anyone to read avatars (if bucket is public or you use public URLs)
-- Or, for private buckets, you'd generate signed URLs in your backend.
-- This policy is for direct access if the bucket allows public reads.
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Authenticated users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated USING (
bucket_id = 'avatars' AND
auth.uid() IS NOT NULL AND
(storage.foldername(name))[1] = auth.uid()::text
-- (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

COMMENT ON POLICY "Authenticated users can upload avatars" ON storage.objects IS 'Authenticated users can upload files to their own user-id prefixed path in the "avatars" bucket.';
COMMENT ON POLICY "Authenticated users can update their own avatars" ON storage.objects IS 'Authenticated users can update files in their own user-id prefixed path in the "avatars" bucket.';
COMMENT ON POLICY "Public read access for avatars" ON storage.objects IS 'Anyone can read files from the "avatars" bucket (if bucket settings allow). For private buckets, use signed URLs.';
COMMENT ON POLICY "Authenticated users can delete their own avatars" ON storage.objects IS 'Authenticated users can delete files from their own user-id prefixed path in the "avatars" bucket.';

-- Note: The (storage.foldername(name))[1] = auth.uid()::text check assumes that
-- the file path is directly like 'user_id/filename.jpg'.
-- If you have nested folders like 'user_id/public_data/filename.jpg',
-- this check might need adjustment or you might use `name LIKE auth.uid()::text || '/%'`.
-- The example uses `(storage.foldername(name))[1]`. If your filenames don't contain '/',
-- then `storage.foldername(name)` returns an array with the full name as the first element.
-- A more robust check for files directly under a user_id folder would be:
-- `(regexp_split_to_array(name, E'\/'))[1] = auth.uid()::text AND array_length(regexp_split_to_array(name, E'\/'), 1) > 1`
-- For simplicity, the provided policy uses `(storage.foldername(name))[1]`. Review and test this against your actual file path structure.
-- If avatar files are directly named (e.g. user_id.png) and not in a folder, the check should be `name = auth.uid()::text || '.png'` or similar.
-- The current setup assumes a path like `00000000-0000-0000-0000-000000000000/avatar.jpg`.
