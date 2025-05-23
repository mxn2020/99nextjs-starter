// src/lib/supabase/client.ts - Browser client
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Ensure PKCE is enabled for OAuth flows
        flowType: 'pkce',
        // Set proper storage for auth tokens
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Custom storage key name from environment variable
        storageKey: process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key',
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

