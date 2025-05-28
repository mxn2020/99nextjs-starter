import type { SupabaseAuthOptions } from './types';
export const supabaseAuthConfig: SupabaseAuthOptions = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirects: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
