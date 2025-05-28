import { createBrowserClient } from '@supabase/ssr';
import type { DefaultDatabase } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientKeys, getSupabaseConfig } from './keys';

export function createSupabaseBrowserClient<TDatabase = DefaultDatabase>(
  supabaseUrl?: string,
  supabaseAnonKey?: string
): SupabaseClient<TDatabase> {
  // Use standardized key functions with optional overrides
  const { url, anonKey, storageKey } = supabaseUrl || supabaseAnonKey 
    ? { 
        url: supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        storageKey: process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'
      }
    : getSupabaseClientKeys();

  // Get debug setting from config
  const config = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  return createBrowserClient<TDatabase>(
    url,
    anonKey,
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
        debug: config.debug,
      },
      global: {
        headers: {
          'X-Client-Info': 'nextjs-supabase-auth',
        },
      },
    }
  );
}