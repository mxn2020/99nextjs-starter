
-- This file is for database helper functions related to the AI package.
-- For example, functions to encapsulate complex queries or business logic at the DB level.

-- Function to get all messages for an agent session, ordered correctly.
CREATE OR REPLACE FUNCTION public.get_agent_session_messages(p_session_id UUID, p_account_id UUID)
RETURNS SETOF public.ai_agent_messages AS $$
BEGIN
-- First, check if the requesting user (via p_account_id logic) has access to this session
IF NOT EXISTS (
SELECT 1 FROM public.ai_agent_sessions s
JOIN public.user_accounts ua ON s.account_id = ua.account_id
WHERE s.id = p_session_id AND ua.user_id = auth.uid() AND s.account_id = p_account_id
) THEN
RAISE EXCEPTION 'Access denied or session not found for this account.';
END IF;

RETURN QUERY
SELECT *
FROM public.ai_agent_messages
WHERE session_id = p_session_id AND account_id = p_account_id -- Redundant account_id check for safety
ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_agent_session_messages(UUID, UUID) IS 'Retrieves all messages for a given agent session, ensuring the caller has access through their account.';

-- Function to log AI usage (callable from triggers or server-side code if needed)
-- This is an alternative or supplement to application-level logging.
-- Server actions will likely call the `logAiUsage` utility directly.
-- This SQL function might be useful for DB triggers if certain events should auto-log.
CREATE OR REPLACE FUNCTION public.log_ai_action(
p_account_id UUID,
p_user_id UUID,
p_model_id VARCHAR(255),
p_action_type ai_action_type,
p_prompt_tokens INT DEFAULT NULL,
p_completion_tokens INT DEFAULT NULL,
p_total_tokens INT DEFAULT NULL,
p_content_id UUID DEFAULT NULL,
p_agent_session_id UUID DEFAULT NULL
)
RETURNS public.ai_usage_logs AS $$
DECLARE
new_log public.ai_usage_logs;
BEGIN
INSERT INTO public.ai_usage_logs (
account_id,
user_id,
model_id,
action_type,
prompt_tokens,
completion_tokens,
total_tokens,
content_id,
agent_session_id
)
VALUES (
p_account_id,
p_user_id,
p_model_id,
p_action_type,
p_prompt_tokens,
p_completion_tokens,
p_total_tokens,
p_content_id,
p_agent_session_id
)
RETURNING * INTO new_log;

```
RETURN new_log;
```

END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION public.log_ai_action(UUID, UUID, VARCHAR(255), ai_action_type, INT, INT, INT, UUID, UUID) IS 'Helper function to insert a record into ai_usage_logs. Primarily for use by trusted server-side code or triggers.';

-- Example of how it might be called from SQL (e.g. from another function or trigger)
-- SELECT public.log_ai_action(
--   'account-uuid-here',
--   'user-uuid-here',
--   'gpt-4o',
--   'text_generation',
--   150,
--   300,
--   450
-- );

-- TODO: Consider adding more helper functions as needed, e.g.:
-- - Functions for summarizing usage per account.
-- - Functions for archiving or managing old AI content.
-- - Functions for searching AI content with specific criteria.

-- Note: The SECURITY DEFINER clause on these functions means they run with the permissions
-- of the user who defined the function (typically a superuser or admin role).
-- This is powerful and should be used carefully. Ensure all parameters are validated
-- or that the function's logic correctly handles permissions if it's making cross-account modifications
-- (which these examples generally avoid by scoping to p_account_id).
-- For `get_agent_session_messages`, it explicitly checks user's access to the `p_account_id`.
