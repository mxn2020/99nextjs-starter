
CREATE TABLE public.system_settings (
    id INT PRIMARY KEY DEFAULT 1, -- Enforce single row
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can read and update settings
CREATE POLICY "Allow admin read access to system settings"
ON public.system_settings
FOR SELECT
TO authenticated -- Check will be done by is_admin() in the calling function/action
USING (public.is_admin());

CREATE POLICY "Allow admin update access to system settings"
ON public.system_settings
FOR UPDATE
TO authenticated -- Check will be done by is_admin() in the calling function/action
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMENT ON TABLE public.system_settings IS 'Stores global system settings as a single JSONB object in a single row.';
COMMENT ON COLUMN public.system_settings.settings IS 'JSONB object containing various system settings like feature flags, default values etc.';
COMMENT ON COLUMN public.system_settings.updated_at IS 'Timestamp of the last update to the settings.';

-- Initial default settings
INSERT INTO public.system_settings (id, settings) VALUES (1, '{
    "feature_new_dashboard": false,
    "maintenance_mode": false,
    "default_items_per_page": 10
}')
ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings;


-- Function to update last updated timestamp
CREATE OR REPLACE FUNCTION public.trg_update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER handle_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_system_settings_updated_at();
