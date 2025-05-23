-- Add preferences JSONB column to users table
ALTER TABLE public.users ADD COLUMN email TEXT DEFAULT NULL;

-- Add comment for the column
COMMENT ON COLUMN public.users.email IS 'User email address.';
