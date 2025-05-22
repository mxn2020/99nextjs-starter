
CREATE TYPE public.activity_log_type AS ENUM (
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_SIGNUP',
    'USER_PROFILE_UPDATE',
    'USER_PASSWORD_RESET_REQUEST', -- TODO: Implement logging for this
    'USER_PASSWORD_UPDATE', -- TODO: Implement logging for this
    'ADMIN_USER_CREATE',
    'ADMIN_USER_UPDATE',
    'ADMIN_USER_DELETE',
    'ADMIN_USER_SUSPEND',
    'ADMIN_USER_UNSUSPEND',
    'ADMIN_USER_EMAIL_VERIFY_MANUAL',
    'ADMIN_USER_RESEND_VERIFICATION',
    'ADMIN_SYSTEM_SETTINGS_UPDATE', -- TODO: Implement logging for this
    'GENERAL_ADMIN_ACTION',
    'GENERAL_USER_ACTION'
);

CREATE TABLE public.user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type public.activity_log_type NOT NULL,
    description TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    target_resource_id TEXT,
    target_resource_type TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.user_activity_logs IS 'Records user and admin activities within the application.';
COMMENT ON COLUMN public.user_activity_logs.user_id IS 'The user account primarily associated with the activity (e.g., the user being modified, or the user logging in). Can be NULL if activity is system-wide and not user-specific.';
COMMENT ON COLUMN public.user_activity_logs.actor_id IS 'The user who performed the action. Same as user_id if self-action, or admin_id if admin action. Can be NULL if action is system-initiated.';
COMMENT ON COLUMN public.user_activity_logs.activity_type IS 'Type of activity performed.';
COMMENT ON COLUMN public.user_activity_logs.description IS 'A human-readable description of the activity.';
COMMENT ON COLUMN public.user_activity_logs.details IS 'Additional JSONB data specific to the activity (e.g., changed fields).';
COMMENT ON COLUMN public.user_activity_logs.ip_address IS 'IP address from which the activity originated.';
COMMENT ON COLUMN public.user_activity_logs.user_agent IS 'User agent of the client performing the activity.';
COMMENT ON COLUMN public.user_activity_logs.target_resource_id IS 'ID of the entity that was affected by the activity (e.g., another user ID, setting ID).';
COMMENT ON COLUMN public.user_activity_logs.target_resource_type IS 'Type of the entity affected (e.g., user, setting).';

-- Indexes
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_actor_id ON public.user_activity_logs(actor_id);
CREATE INDEX idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_target_resource_id_type ON public.user_activity_logs(target_resource_id, target_resource_type);


-- RLS Policies for user_activity_logs
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Function to check if the current user is an admin (re-use if already exists from 0003/0006 migration and is correct)
-- Ensure this function exists and is accurate:
-- CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'); $$ LANGUAGE sql SECURITY DEFINER;

-- Admins can perform any action on activity logs
CREATE POLICY "Allow admin full access to user_activity_logs"
ON public.user_activity_logs FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can read their own activity logs (where they are the user_id or actor_id)
CREATE POLICY "Allow user to read their own activity_logs"
ON public.user_activity_logs FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR auth.uid() = actor_id
);

-- Backend service role will bypass RLS. For actions logged by users themselves (e.g. profile update),
-- this policy allows authenticated users to insert logs where they are the actor.
CREATE POLICY "Allow authenticated users to insert their own action logs"
ON public.user_activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- DENY all other actions by default if not covered by specific policies.
-- Supabase default is DENY, so explicit DENY policy is not strictly necessary unless overriding a previous permissive one.
    