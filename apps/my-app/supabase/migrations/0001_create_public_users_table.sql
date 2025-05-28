
-- Create the public.users table
CREATE TABLE public.users (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
display_name TEXT,
avatar_url TEXT,
onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
onboarding_step INTEGER DEFAULT 1 NOT NULL,
role user_role DEFAULT 'user'::user_role NOT NULL, -- Default role is 'user'
created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add comments to the table and columns
COMMENT ON TABLE public.users IS 'Stores public user profile information, extending auth.users.';
COMMENT ON COLUMN public.users.id IS 'User ID, references auth.users.id.';
COMMENT ON COLUMN public.users.display_name IS 'Public display name of the user.';
COMMENT ON COLUMN public.users.avatar_url IS 'URL of the user''s avatar image.';
COMMENT ON COLUMN public.users.onboarding_completed IS 'Flag indicating if the user has completed the onboarding process.';
COMMENT ON COLUMN public.users.onboarding_step IS 'Current step in the onboarding process for the user.';
COMMENT ON COLUMN public.users.role IS 'Role of the user (e.g., ''user'', ''admin'').';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp of when the user profile was created.';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp of when the user profile was last updated.';
