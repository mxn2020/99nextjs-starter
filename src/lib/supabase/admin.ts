// src/clients/supabase/admin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminKeys, getSupabaseConfig } from './keys';
import { Database } from '@/lib/database.types';

// Type-safe client storage
type AdminClientCache = Map<string, SupabaseClient<Database>>;

// Global singleton cache for admin clients
let adminClientCache: AdminClientCache = new Map();

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
   * Whether to use a singleton instance (default: true)
   */
  singleton?: boolean;

  /**
   * Force a fresh instance even when singleton is true
   */
  forceNew?: boolean;

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
 * - Singleton pattern with cache key based on configuration
 * - Proper type definitions
 * - Additional security settings
 * - Debug mode option
 * 
 * @param options Configuration options
 * @returns A configured Supabase admin client instance
 */
export function createSupabaseAdminClient(
  options?: AdminClientOptions
): SupabaseClient<Database> {

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

  // Generate a cache key based on the configuration
  // We include less info in the key for admin clients for security
  const cacheKey = `${config.url}:admin:${config.storage.key}`;

  // For singleton pattern (default), try to return from cache first
  const useSingleton = options?.singleton !== false;
  if (useSingleton && !options?.forceNew) {
    const cachedClient = adminClientCache.get(cacheKey);
    if (cachedClient) {
      return cachedClient;
    }
  }

  // Create debug logger if enabled
  const log = config.debug || options?.debug
    ? (...args: any[]) => console.log('[SupabaseAdminClient]', ...args)
    : () => { };

  log('Creating new admin client instance');

  // Create new client instance with enhanced security settings
  const client = createClient<Database>(
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

  // Store in cache if singleton pattern
  if (useSingleton) {
    adminClientCache.set(cacheKey, client);
    log('Admin client cached');
  }

  return client;
}

/**
 * Clears the admin client cache, useful for testing
 * 
 * @returns `true` if clients were cleared, `false` if cache was already empty
 */
export function clearSupabaseAdminClient(): boolean {
  const hadClients = adminClientCache.size > 0;
  adminClientCache = new Map();
  return hadClients;
}