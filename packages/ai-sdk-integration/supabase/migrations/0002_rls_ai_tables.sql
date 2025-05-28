
-- Helper function to get user's account IDs
-- This assumes you have a way to link auth.users to public.accounts.
-- A common pattern is a `user_accounts` join table or a direct link on `public.users` or `public.accounts`.
-- For this example, let's assume a `user_accounts` table exists:
-- CREATE TABLE public.user_accounts (
--   user_id UUID NOT NULL REFERENCES auth.users(id),
--   account_id UUID NOT NULL REFERENCES public.accounts(id),
--   PRIMARY KEY (user_id, account_id)
-- );
-- If your structure is different, adjust this function.
-- If a user is directly linked to ONE personal account on public.users or public.accounts, it's simpler.
-- For this RLS, we will primarily rely on the `account_id` being passed correctly by server-side logic
-- which has already established the user's permissions for that account.
-- The policies will ensure that operations are scoped to the `account_id` the user has access to.

-- Get the current user's ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## -- Function to check if the current user is a member of a given account. -- This is a placeholder and needs to be adapted to your specific multi-tenancy setup -- (e.g., how users are associated with accounts in `public.accounts`). -- If each user has one personal account, this could be simpler. -- If using a teams/members structure, you'd check that table. -- For now, we assume server-side logic determines the correct `account_id`. -- The RLS will mainly ensure that an `account_id` field matches what's expected. -- A more robust check: -- CREATE OR REPLACE FUNCTION public.is_account_member(check_account_id UUID) -- RETURNS BOOLEAN AS $$ -- DECLARE --   auth_user_id UUID := auth.uid(); -- BEGIN --   -- Example: Check if user is directly linked to the account or via a members table --   -- This is highly dependent on your specific schema for accounts and users. --   -- For instance, if public.users has an account_id for personal account: --   -- RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth_user_id AND personal_account_id = check_account_id) OR --   --        EXISTS (SELECT 1 FROM public.account_members WHERE user_id = auth_user_id AND account_id = check_account_id); --   -- For this template, we'll assume the server action provides a validated account_id. --   -- So, policies will check `USING (account_id = some_validated_account_id_from_session_or_claim)`. --   -- However, for direct table access, we need a general rule. --   -- Let's assume a function `current_user_can_access_account(account_id UUID)` exists or is implemented by the app. --   -- For simplicity here, we'll allow if the user's auth.uid() is linked to the account_id via `public.users.id` --   -- and `public.users` has an `account_id` that maps to `public.accounts`. This is just one possible setup. --   -- A common setup: auth.users.id links to public.users.id, and public.users has a `default_account_id` or similar. --   -- Or a `user_accounts` many-to-many table.

## --   -- This is a simplified check, replace with your actual account membership logic. --   -- It assumes a `user_accounts` table exists mapping `auth.uid()` to `account_id`. --   RETURN EXISTS ( --     SELECT 1 FROM public.user_accounts WHERE user_id = auth_user_id AND account_id = check_account_id --   ); -- END; -- $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

## -- As the prompt states "data gets linked via accounts (personal account, team account, family account, etc.)" -- and "server first, client second data handling", server actions will be responsible for ensuring -- the `account_id` passed to DB operations is one the user has rights to. -- RLS policies will then ensure that any query for a given `account_id` can only succeed if that condition is met.

-- For a general RLS policy, we'll assume `current_setting('request.jwt.claims', true)::jsonb->>'app_metadata.account_ids'`
-- contains an array of account IDs the user can access, or a similar mechanism.
-- Or, a simpler policy is just `USING (account_id = some_account_id_passed_by_trusted_server_code)`.
-- Let's use a function that checks if `auth.uid()` is associated with the `account_id` through `public.user_accounts`.
-- This requires the `public.user_accounts` table to be correctly populated.

-- Ensure user_accounts table exists for this RLS strategy.
-- CREATE TABLE IF NOT EXISTS public.user_accounts (
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
--     -- role TEXT, -- e.g., 'owner', 'admin', 'member'
--     PRIMARY KEY (user_id, account_id)
-- );
-- Populate this table when users are added to accounts.

-- --- AI Prompts Table ---
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can manage their own prompts"
ON public.ai_prompts
FOR ALL
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_prompts.account_id) )
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_prompts.account_id) );

-- --- AI Generated Contents Table ---
ALTER TABLE public.ai_generated_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can manage their own generated contents"
ON public.ai_generated_contents
FOR ALL
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_generated_contents.account_id) )
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_generated_contents.account_id) );

-- --- AI Agents Table ---
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can manage their own agents"
ON public.ai_agents
FOR ALL
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agents.account_id) )
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agents.account_id) );

-- --- AI Agent Sessions Table ---
ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can manage their own agent sessions"
ON public.ai_agent_sessions
FOR ALL
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agent_sessions.account_id) )
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agent_sessions.account_id) );

-- --- AI Agent Messages Table ---
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can manage their own agent messages"
ON public.ai_agent_messages
FOR ALL
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agent_messages.account_id) )
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_agent_messages.account_id) );

-- --- AI Usage Logs Table ---
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can view their own usage logs"
ON public.ai_usage_logs
FOR SELECT
USING ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_usage_logs.account_id) );

-- For INSERT, server-side (admin/service_role) logic should handle this.
-- If direct insert by users is needed (less common for logs):
CREATE POLICY "Accounts can insert their own usage logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK ( EXISTS (SELECT 1 FROM public.user_accounts WHERE user_accounts.user_id = auth.uid() AND user_accounts.account_id = ai_usage_logs.account_id) );

-- Modifying/Deleting logs is typically restricted to admin roles.
-- CREATE POLICY "Admins can manage usage logs"
-- ON public.ai_usage_logs
-- FOR UPDATE, DELETE
-- USING (is_admin(auth.uid())); -- Assuming an is_admin function

-- Note: The `EXISTS (SELECT 1 FROM public.user_accounts ...)` clause is crucial.
-- Ensure `public.user_accounts` accurately reflects user-account relationships.
-- If a user can belong to multiple accounts (e.g., personal, team), this structure works.
-- If a user has only ONE account (e.g., their "personal" account is the only one they use),
-- you might have a simpler RLS check, for example, if `public.users` has an `account_id` field:
-- `USING (account_id = (SELECT personal_account_id FROM public.users WHERE id = auth.uid()))`
-- The current RLS is more flexible for multi-account scenarios.
