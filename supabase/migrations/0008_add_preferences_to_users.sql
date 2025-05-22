ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- You can add more specific constraints or default values if needed.
-- For example, to ensure it's never null (though Supabase UI might handle this):
-- ALTER TABLE public.users ALTER COLUMN preferences SET NOT NULL;

-- If you want to add a GIN index for better JSONB query performance (optional):
-- CREATE INDEX idx_users_preferences ON public.users USING GIN (preferences);