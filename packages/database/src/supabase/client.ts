import { createBrowserClient } from '@supabase/ssr';
import type { DefaultDatabase } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseBrowserClient<TDatabase = DefaultDatabase>(
  supabaseUrl?: string,
  supabaseAnonKey?: string
): SupabaseClient<TDatabase> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const storageKey = process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key';

  if (!url || !key) {
    throw new Error('Missing Supabase URL or anon key');
  }

  return createBrowserClient<TDatabase>(
    url,
    key,
    {
      auth: {
        // Ensure PKCE is enabled for OAuth flows
        flowType: 'pkce',
        // Set proper storage for auth tokens
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Custom storage key name from environment variable
        storageKey: storageKey,
        // Enable automatic refresh
        autoRefreshToken: true,
        // Enable persistence across tabs
        persistSession: true,
        // Debug OAuth issues
        debug: process.env.NODE_ENV === 'development',
      },
      global: {
        headers: {
          'X-Client-Info': 'nextjs-supabase-auth',
        },
      },
    }
  );
}