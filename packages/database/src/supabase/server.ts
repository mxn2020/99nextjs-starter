import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { DefaultDatabase } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientKeys, getSupabaseConfig } from './keys';

export async function createSupabaseServerClient<TDatabase = DefaultDatabase>(
  supabaseUrl?: string,
  supabaseAnonKey?: string
): Promise<SupabaseClient<TDatabase>> {
  const cookieStore = await cookies();
  
  // Use standardized key functions with optional overrides
  const { url, anonKey } = supabaseUrl || supabaseAnonKey 
    ? { 
        url: supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    : getSupabaseClientKeys();

  // Get debug setting from config
  const config = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  return createServerClient<TDatabase>(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cases where cookies can't be set (e.g., in middleware)
            console.warn('Could not set cookie:', name, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cases where cookies can't be removed
            console.warn('Could not remove cookie:', name, error);
          }
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false, // Handled by middleware
        persistSession: false, // Server-side doesn't persist
        debug: config.debug,
      },
    }
  );
}

