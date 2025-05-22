
-- Function to insert a new user into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Important for SECURITY DEFINER functions
AS $$
BEGIN
INSERT INTO public.users (id, role)
VALUES (NEW.id, 'user'::user_role); -- New users get 'user' role by default
RETURN NEW;
END;
$$;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile in public.users when a new user signs up via auth.users.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'After a new user is inserted into auth.users, this trigger calls handle_new_user() to create a corresponding profile.';
