
// Import Database types if you have them generated
import type { Database } from './database.types';

// User profile data from your public.users table
export type UserProfile = Database['public']['Tables']['users']['Row'];

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

export interface OnboardingData {
    step1?: {
        displayName?: string;
        avatarUrl?: string;
    };
    step2?: {
        // preferences
    };
    step3?: {
        // customizations
    };
}

// Types for User Activity Logging
export type ActivityLogType = Database['public']['Enums']['activity_log_type'];

export type UserActivityLogInsert = Database['public']['Tables']['user_activity_logs']['Insert'];
export type UserActivityLog = Database['public']['Tables']['user_activity_logs']['Row'];


// Generic type for server action results with potential errors
export type ActionResult<T = null> =
	| { success: true; data: T }
	| { success: false; error: { message: string; code?: string } };
