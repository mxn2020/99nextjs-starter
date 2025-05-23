
// Import Database types if you have them generated
import type { Database, Json } from './database.types';
import type { UserIdentity as SupabaseUserIdentity } from '@supabase/supabase-js';


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
    identities?: UserIdentity[] | null; // Added from Supabase User
};

export interface OnboardingDataStep1 {
    display_name?: string;
    avatar_url?: string;
}
export interface OnboardingDataStep2 extends UserCustomPreferences { }
export interface OnboardingDataStep3 extends UserCustomPreferences { }


// Types for User Activity Logging
export type ActivityLogType = Database['public']['Enums']['activity_log_type']
  | 'USER_OAUTH_LINK'  
  | 'USER_OAUTH_UNLINK' 
  | 'USER_DATA_EXPORT_REQUEST' 
  | 'USER_ACCOUNT_DELETE' 
  | 'USER_PASSWORD_RESET_REQUEST' 
  | 'ADMIN_SYSTEM_SETTINGS_UPDATE';


export type UserActivityLogInsert = Database['public']['Tables']['user_activity_logs']['Insert'] & {
    activity_type: ActivityLogType; // Override to use the extended union type
};
export type UserActivityLog = Database['public']['Tables']['user_activity_logs']['Row'] & {
    activity_type: ActivityLogType; // Override to use the extended union type
};


// Generic type for server action results with potential errors
export type ActionResult<T = null> =
    | { success: true; data?: T, message?: string }
    | { success: false; error: string , errors?: any | null }
    | { success: false; error: { message: string } , errors?: any | null }
    | { success: false; error: { message: string, code: string } , errors?: any | null }


// Supabase User Identity type
export type UserIdentity = SupabaseUserIdentity;

// --- System Settings Types ---
export type EmailProviderType = 'none' | 'resend' | 'smtp';

export interface ResendSettings {
    api_key?: string; // Sensitive
    default_from_email?: string;
}

export interface SMTPSettings {
    host?: string;
    port?: number;
    user?: string;
    password?: string; // Sensitive
    secure?: boolean; // e.g. use SSL/TLS
    default_from_email?: string;
}

export interface EmailProviderSettings {
    resend?: ResendSettings;
    smtp?: SMTPSettings;
}
export interface SystemSettings {
    feature_new_dashboard?: boolean;
    maintenance_mode?: boolean;
    default_items_per_page?: number;
    email_provider?: EmailProviderType;
    default_from_name?: string; // General 'From' name for emails
    email_provider_settings?: EmailProviderSettings;
    // Add other settings as needed
}

// Analytics Data Types
export interface DailySignup {
    signup_date: string; // Date string e.g. "2023-10-26"
    count: number;
}

export interface UserRoleDistribution {
    role: 'user' | 'admin' | string; // Assuming user_role ENUM or string
    count: number;
}

export interface AdminAnalyticsData {
    totalUsers: number;
    activeUsersLast7Days: number;
    dailySignups: DailySignup[];
    userRoleDistribution: UserRoleDistribution[];
}
