
-- Function to get daily signups for the last N days
CREATE OR REPLACE FUNCTION get_daily_signups(days_limit INT DEFAULT 30)
RETURNS TABLE(signup_date DATE, count BIGINT)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT DATE(created_at) as signup_date, COUNT(*) as count
  FROM auth.users
  WHERE created_at >= timezone('utc', now()) - (days_limit || ' days')::interval
  GROUP BY DATE(created_at)
  ORDER BY signup_date ASC;
$$;

-- Function to get user role distribution
CREATE OR REPLACE FUNCTION get_user_role_distribution()
RETURNS TABLE(role user_role, count BIGINT)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT users.role, COUNT(*) as count
  FROM public.users
  GROUP BY users.role;
$$;

-- Function to get total users count
CREATE OR REPLACE FUNCTION get_total_users_count()
RETURNS BIGINT
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT COUNT(*) FROM auth.users;
$$;

-- Function to get total active users in a given interval (e.g., '7 days')
CREATE OR REPLACE FUNCTION get_active_users_count(p_interval INTERVAL DEFAULT '7 days')
RETURNS BIGINT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT id)
    FROM auth.users
    WHERE last_sign_in_at >= timezone('utc', now()) - p_interval
  );
END;
$$;

-- Note: SECURITY DEFINER is used for simplicity here.
-- Ensure appropriate grants if these functions are to be called by roles other than postgres or service_role.
-- For admin actions using the service_role key, direct execution is fine.
-- If calling via user sessions (even admin users), ensure is_admin() checks are done in the server actions.
-- GRANT EXECUTE ON FUNCTION get_daily_signups(INT) TO authenticated; -- Example grant if needed
