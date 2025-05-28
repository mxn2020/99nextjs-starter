
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './keys';
import type { DefaultDatabase } from './types';

/**
 * Options for creating an admin client
 */
export interface AdminClientOptions {
  /**
   * Custom headers to include with requests
   */
  headers?: Record<string, string>;

  /**
   * Enable debug mode for extra logging
   */
  debug?: boolean;

  /**
   * Override for service role key (typically from environment)
   */
  serviceRoleKey?: string;

  /**
   * Override for storage key (typically from environment)
   */
  storageKey?: string;
}

/**
 * Creates a Supabase client with admin privileges using the Service Role Key.
 * 
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS)!
 * Only use in trusted server-side environments (e.g., backend tasks, migrations).
 * 
 * Features:
 * - Proper type definitions with custom database types
 * - Additional security settings
 * - Debug mode option
 * - No caching for type safety across different database schemas
 * 
 * @param options Configuration options
 * @returns A configured Supabase admin client instance
 */
export function createSupabaseAdminClient<TDatabase = DefaultDatabase>(
  options?: AdminClientOptions
): SupabaseClient<TDatabase> {

  const tokenStorageKey = options?.storageKey || process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'

  // Get configuration with optional overrides
  const config = getSupabaseConfig({
    serviceRoleKey: options?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY,
    headers: options?.headers,
    debug: options?.debug,
    storage: {
      key: tokenStorageKey,
      cookieName: tokenStorageKey,
    },
  });

  // Ensure service role key is available
  if (!config.serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations'
    );
  }

  // Create debug logger if enabled
  const log = config.debug || options?.debug
    ? (...args: any[]) => console.log('[SupabaseAdminClient]', ...args)
    : () => { };

  log('Creating new admin client instance');

  // Create new client instance with enhanced security settings
  const client = createClient<TDatabase>(
    config.url,
    config.serviceRoleKey,
    {
      auth: {
        // Important security settings for admin clients
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: config.storage.key,
      },
      global: {
        headers: config.headers,
      },
    }
  );

  return client;
}

