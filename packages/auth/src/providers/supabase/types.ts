import type { AuthConfig } from '../../types';
export interface SupabaseAuthOptions extends Partial<AuthConfig> {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
    flowType?: 'implicit' | 'pkce';
    storage?: any;
    storageKey?: string;
}
export interface SupabaseUser {
    id: string;
    email?: string;
    phone?: string;
    email_confirmed_at?: string;
    phone_confirmed_at?: string;
    created_at: string;
    updated_at: string;
    last_sign_in_at?: string;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
    identities?: any[];
    factors?: any[];
}
export interface SupabaseSession {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: SupabaseUser;
}
