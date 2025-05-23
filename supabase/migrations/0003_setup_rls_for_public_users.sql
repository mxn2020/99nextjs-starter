-- Ensure RLS is enabled on the table (should be done by 0001 migration, but good practice to ensure)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own profile
CREATE POLICY "Allow individual user read access" ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow individual user update access" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users -- Use public.users to be explicit
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Policy: Allow admins to read all user profiles
CREATE POLICY "Allow admin read access to all users" ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Policy: Allow admins to create new user profiles
CREATE POLICY "Allow admin create access to all users" ON public.users
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Allow admins to update all user profiles
CREATE POLICY "Allow admin update access to all users" ON public.users
    USING (public.is_admin())
    WITH CHECK (public.is_admin());  

-- Policy: Allow admins to delete user profiles
-- Note: Deletion of users should ideally be handled via Supabase auth functions (supabase.auth.admin.deleteUser())
-- to ensure data integrity across auth.users and public.users.
-- This policy allows direct deletion from public.users by an admin if necessary, but cascade delete on auth.users is preferred.
CREATE POLICY "Allow admin delete access" ON public.users
  FOR DELETE
  USING (public.is_admin());

  

COMMENT ON POLICY "Allow individual user read access" ON public.users IS 'Users can select their own profile data.';
COMMENT ON POLICY "Allow individual user update access" ON public.users IS 'Users can update their own profile data.';
COMMENT ON POLICY "Allow admin read access to all users" ON public.users IS 'Admins can select any user''s profile data.';
COMMENT ON POLICY "Allow admin update access to all users" ON public.users IS 'Admins can update any user''s profile data.';
COMMENT ON POLICY "Allow admin delete access" ON public.users IS 'Admins can delete any user''s profile data. Prefer using Supabase auth admin functions for user deletion.';
