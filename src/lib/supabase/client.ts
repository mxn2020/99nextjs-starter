// src/clients/supabase/browser.ts
import { createBrowserClient as createSupabaseBrowserClientCore } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './keys';
import { Database } from '@/lib/database.types';

// Type-safe client storage
type BrowserClientCache = Map<string, SupabaseClient<Database>>;

// Global singleton cache for browser clients
let browserClientCache: BrowserClientCache = new Map();

/**
 * Options for creating a browser client
 */
export interface BrowserClientOptions {
  /**
   * Custom storage key for authentication
   */
  storageKey?: string;
  
  /**
   * Whether to use a singleton instance (default: true)
   */
  singleton?: boolean;
  
  /**
   * Custom headers to include with requests
   */
  headers?: Record<string, string>;
  
  /**
   * Debug mode for extra logging
   */
  debug?: boolean;
  
  /**
   * Force a fresh instance even when singleton is true
   */
  forceNew?: boolean;
}

/**
 * Creates a Supabase client for browser environments with improved caching and configuration.
 * 
 * Features:
 * - Singleton pattern with cache key based on configuration
 * - Proper type definitions
 * - Configurable storage keys
 * - Optional debug mode
 * 
 * @param options Configuration options that override environment defaults
 * @returns A configured Supabase client instance
 */
export function createSupabaseBrowserClient(
  options?: BrowserClientOptions
): SupabaseClient<Database> {
  const tokenStorageKey = options?.storageKey || process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'
  
  // Get configuration with optional overrides
  const config = getSupabaseConfig({
    storage: {
      key: tokenStorageKey,
      cookieName: tokenStorageKey,
      cookieOptions: {
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      }
    },
    headers: options?.headers,
    debug: options?.debug,
  });
  

  // Generate a cache key based on the configuration
  const cacheKey = `${config.url}:${config.anonKey}:${config.storage.key}`;
  
  // For singleton pattern (default), try to return from cache first
  const useSingleton = options?.singleton !== false;
  if (useSingleton && !options?.forceNew) {
    const cachedClient = browserClientCache.get(cacheKey);
    if (cachedClient) {
      return cachedClient;
    }
  }
  
  // Create debug logger if enabled
  const log = config.debug || options?.debug 
    ? (...args: any[]) => console.log('[SupabaseBrowserClient]', ...args)
    : () => {};
    
  log('Creating new browser client instance');
  
  // Create new client instance
  const client = createSupabaseBrowserClientCore<Database>(
    config.url,
    config.anonKey,
    {
      auth: {
        storageKey: config.storage.key,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: config.headers,
      },
    }
  );
  
  // Store in cache if singleton pattern
  if (useSingleton) {
    browserClientCache.set(cacheKey, client);
    log('Client cached with key:', cacheKey);
  }
  
  return client;
}

/**
 * Clears the browser client cache, useful for testing or when auth state changes
 * 
 * @param specificKey Optional specific cache key to clear, otherwise clears all
 * @returns `true` if client(s) were found and cleared, `false` otherwise
 */
export function clearSupabaseBrowserClient(specificKey?: string): boolean {
  if (specificKey) {
    const hasKey = browserClientCache.has(specificKey);
    if (hasKey) {
      browserClientCache.delete(specificKey);
      return true;
    }
    return false;
  }
  
  // Clear all clients
  const hadClients = browserClientCache.size > 0;
  browserClientCache = new Map();
  return hadClients;
}

/**
 * Lists all cached browser client keys
 * Useful for debugging cache issues
 */
export function listCachedBrowserClients(): string[] {
  return Array.from(browserClientCache.keys());
}