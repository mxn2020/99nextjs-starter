-- Add preferences JSONB column to users table
ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for the column
COMMENT ON COLUMN public.users.preferences IS 'User preferences and customization settings stored as JSON.';
