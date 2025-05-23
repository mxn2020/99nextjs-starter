DROP POLICY IF EXISTS "Allow individual user read access" ON public.users;
DROP POLICY IF EXISTS "Allow individual user update access" ON public.users;
DROP POLICY IF EXISTS "Allow admin read access to all users" ON public.users;
DROP POLICY IF EXISTS "Allow admin update access to all users" ON public.users;
DROP POLICY IF EXISTS "Allow admin delete access" ON public.users;

-- Modify the is_admin function to be more efficient
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    JOIN public.users ON auth.users.id = public.users.id
    WHERE auth.users.id = auth.uid() AND public.users.role = 'admin'::user_role
  );
$$;

-- Create a simpler function to check user's own row
CREATE OR REPLACE FUNCTION public.is_own_profile(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id = auth.uid();
$$;

-- Re-create all policies with improved functions that don't cause recursion

-- Policy: Allow users to read their own profile - using the simplified function
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (public.is_own_profile(id));

-- Policy: Allow users to update their own profile - using the simplified function
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (public.is_own_profile(id))
WITH CHECK (public.is_own_profile(id));

-- Policy: Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.users
FOR SELECT
USING (public.is_admin());

-- Policy: Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.users
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy: Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.users
FOR DELETE
USING (public.is_admin());

-- Add an additional policy to ensure new users can be created during signup process
CREATE POLICY "Auth service can insert new users"
ON public.users
FOR INSERT
WITH CHECK (TRUE);  -- Allow all inserts, the trigger will handle proper user creation

-- Add comments for clarity
COMMENT ON FUNCTION public.is_admin() IS 'Securely checks if the current user has admin role without causing policy recursion';
COMMENT ON FUNCTION public.is_own_profile(uuid) IS 'Securely checks if the provided user_id matches the current authenticated user';
COMMENT ON POLICY "Users can read own profile" ON public.users IS 'Users can read their own profile data';
COMMENT ON POLICY "Users can update own profile" ON public.users IS 'Users can update their own profile data';
COMMENT ON POLICY "Admins can read all profiles" ON public.users IS 'Admins can read all user profiles';
COMMENT ON POLICY "Admins can update all profiles" ON public.users IS 'Admins can update all user profiles';
COMMENT ON POLICY "Admins can delete profiles" ON public.users IS 'Admins can delete any user profile';
COMMENT ON POLICY "Auth service can insert new users" ON public.users IS 'Allows new user records to be created during the signup process';
