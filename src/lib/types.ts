
// Import Database types if you have them generated
import type { Database, Json } from './database.types';

// User profile data from your public.users table
// Explicitly define preferences structure if needed, otherwise it's Json
export interface UserCustomPreferences {
    notifications_enabled?: boolean;
    contact_method?: 'email' | 'inapp' | 'none';
    preferred_language?: string;
    bio?: string | null;
    feature_beta_access?: boolean;
    privacy_level?: 'public' | 'private' | 'friends_only';
    interface_density?: 'compact' | 'default' | 'comfortable';
    // Add other preference keys here
}

export type UserProfile = Omit<Database['public']['Tables']['users']['Row'], 'preferences'> & {
    preferences?: UserCustomPreferences | Json | null; // Allow more specific type or general Json
};


// Extended AuthUser type to include properties from auth.users table
// that are useful for admin management or display.
export interface ExtendedAuthUser {
    id: string;
    email?: string | null;
    phone?: string | null;
    email_confirmed_at?: string | null;
    phone_confirmed_at?: string | null;
    last_sign_in_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    banned_until?: string | null; // Important for suspension status
    // Add other auth.users fields as needed
}

// Combined type for user data often fetched together
export type UserWithProfileAndAuth = UserProfile & {
    auth_user?: ExtendedAuthUser | null; // Optional auth user details
};

export interface OnboardingDataStep1 {
    display_name?: string;
    avatar_url?: string;
}
export interface OnboardingDataStep2 extends UserCustomPreferences { }
export interface OnboardingDataStep3 extends UserCustomPreferences { }


// Types for User Activity Logging
export type ActivityLogType = Database['public']['Enums']['activity_log_type'];

export type UserActivityLogInsert = Database['public']['Tables']['user_activity_logs']['Insert'];
export type UserActivityLog = Database['public']['Tables']['user_activity_logs']['Row'];


// Generic type for server action results with potential errors
export type ActionResult<T = null> =
    | { success: true; data: T }
    | { success: false; error: { message: string; code?: string } };


