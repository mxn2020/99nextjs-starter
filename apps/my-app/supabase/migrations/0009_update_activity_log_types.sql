
-- Add new values to the activity_log_type ENUM
-- Note: Adding enum values must be done one at a time if not within a transaction block in some systems,
-- but Supabase migrations handle this fine.

ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'USER_OAUTH_LINK';
ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'USER_OAUTH_UNLINK';
ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'USER_DATA_EXPORT_REQUEST';
ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'USER_ACCOUNT_DELETE';

-- Add USER_PASSWORD_RESET_REQUEST to activity_log_type if it was missed previously (was a TODO)
ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'USER_PASSWORD_RESET_REQUEST';
-- Add ADMIN_SYSTEM_SETTINGS_UPDATE to activity_log_type if it was missed previously (was a TODO)
ALTER TYPE public.activity_log_type ADD VALUE IF NOT EXISTS 'ADMIN_SYSTEM_SETTINGS_UPDATE';

COMMENT ON TYPE public.activity_log_type IS 'Records user and admin activities within the application. Updated to include OAuth, data export, and account deletion types.';
