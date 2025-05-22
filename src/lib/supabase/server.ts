// src/clients/supabase/server.ts
import {
  createServerClient as createSupabaseServerClientCore,
  type CookieOptions,
  type CookieMethodsServer,
} from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { type NextRequest, type NextResponse } from 'next/server';
import { getSupabaseConfig } from './keys';
import { Database } from '@/lib/database.types';

/**
 * Cookie store interface - provides a unified way to handle cookies across different Next.js APIs
 * (Server Components, Route Handlers, Middleware, Server Actions)
 */
export interface CookieStore {
  /**
   * Get all cookies as an array of name-value pairs
   */
  getAll(): { name: string; value: string; }[] | null;
  
  /**
   * Set multiple cookies at once
   */
  setAll(cookies: { name: string; value: string; }[], options?: CookieOptions): void;
}

/**
 * Options for creating a server client
 */
export interface ServerClientOptions {
  /**
   * Custom cookie name for authentication (overrides environment configuration)
   */
  cookieName?: string;
  
  /**
   * Custom cookie options (overrides environment configuration)
   */
  cookieOptions?: CookieOptions;
  
  /**
   * Cookie encoding strategy
   */
  cookieEncoding?: 'raw' | 'base64url';
  
  /**
   * Custom headers to include with requests
   */
  headers?: Record<string, string>;
  
  /**
   * Enable debug mode for extra logging
   */
  debug?: boolean;
}

/**
 * Creates a standard cookie store for use with the Next.js `cookies()` function
 * from `next/headers` for server components and route handlers
 * 
 * @param cookieStore The Next.js cookie store
 * @param debug Enable debug logging
 */
function createNextCookieStore(
  cookieStore: ReadonlyRequestCookies,
  debug = false
): CookieStore {
  const log = debug 
    ? (...args: any[]) => console.log('[NextCookieStore]', ...args)
    : () => {};
  
  return {
    getAll() {
      log('Getting all cookies');
      return cookieStore.getAll().map(cookie => ({
        name: cookie.name,
        value: cookie.value,
      }));
    },
    
    setAll(cookies: { name: string; value: string; }[], options?: CookieOptions) {
      log('Setting multiple cookies');
      try {
        cookies.forEach(cookie => {
          cookieStore.set(cookie.name, cookie.value, options);
        });
      } catch (error) {
        // Handle read-only cookie store gracefully
        log('Failed to set cookies. Cookie store might be read-only.', error);
      }
    },
  };
}

/**
 * Creates a cookie store for use with middleware (NextRequest/NextResponse)
 * 
 * @param req Next.js request object
 * @param res Next.js response object
 * @param debug Enable debug logging
 */
// Track if we've already logged middleware cookie operations in this request cycle
// to reduce duplicate logs
let middlewareCookieLogCount = 0;

function createMiddlewareCookieStore(
  req: NextRequest,
  res: NextResponse,
  debug = false
): CookieStore {
  // Increment the log count for this middleware execution
  middlewareCookieLogCount++;
  
  const log = debug 
    ? (...args: any[]) => {
        // Only log the first occurrence to reduce noise
        if (middlewareCookieLogCount <= 1) {
          console.log('[MiddlewareCookieStore]', ...args);
        }
      }
    : () => {};
  
  return {
    getAll() {
      log('Getting all cookies');
      const cookies = req.cookies.getAll();
      return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
      }));
    },
    
    setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
      log('Setting multiple cookies');
      cookies.forEach(cookie => {
        res.cookies.set(cookie.name, cookie.value, {
          ...cookie.options,
          path: '/',
          secure: true,
          sameSite: 'lax',
        });
      });
    },
  };
}

/**
 * Creates a Supabase client for server environments (Server Components, Route Handlers, Server Actions)
 * using a standardized cookie store interface.
 * 
 * @param cookieStoreOrOptions Optional cookie store or configuration options
 * @param options Configuration options (when first parameter is a cookie store)
 * @returns A configured Supabase client instance
 */
export async function createSupabaseServerClient(
  cookieStoreOrOptions?: CookieStore | ReadonlyRequestCookies | ServerClientOptions,
  options?: ServerClientOptions
): Promise<SupabaseClient<Database>> {
  let cookieStore: CookieStore | ReadonlyRequestCookies;
  let clientOptions: ServerClientOptions | undefined;

  // Handle different parameter combinations
  if (!cookieStoreOrOptions || typeof cookieStoreOrOptions === 'object' && 'cookieName' in cookieStoreOrOptions) {
    // If first param is options or undefined, get cookies internally
    const { cookies } = await import('next/headers');
    cookieStore = await cookies(); // cookies() is not async, it returns the store directly
    clientOptions = cookieStoreOrOptions as ServerClientOptions;
  } else {
    // If first param is a cookie store, use it
    cookieStore = cookieStoreOrOptions as CookieStore | ReadonlyRequestCookies;
    clientOptions = options;
  }

  const tokenStorageKey = clientOptions?.cookieName || process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key-dev'

  // Get configuration with optional overrides
  const config = getSupabaseConfig({
    headers: clientOptions?.headers,
    debug: clientOptions?.debug,
    storage: {
      key: tokenStorageKey,
      cookieName: tokenStorageKey,
      cookieOptions: {
        secure: true,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: clientOptions?.cookieOptions?.domain,
      },
    },
  });
  
  // Create debug logger if enabled
  const debug = config.debug || clientOptions?.debug;
  const log = debug 
    ? (...args: any[]) => console.log('[SupabaseServerClient]', ...args)
    : () => {};
    
  log('Creating new server client instance');
  
  // Normalize cookie store to our interface
  const normalizedCookieStore: CookieStore = (() => {
    // First try to use the provided cookie store if it implements our interface
    if ('getAll' in cookieStore && 
        typeof cookieStore.getAll === 'function' && 
        'setAll' in cookieStore && 
        typeof cookieStore.setAll === 'function') {
      return cookieStore as CookieStore;
    }
    
    // Fallback to creating a Next.js cookie store
    return createNextCookieStore(cookieStore as ReadonlyRequestCookies, debug);
  })();
  
  // Create new client instance with proper cookie handling
  return createSupabaseServerClientCore<Database>(
    config.url,
    config.anonKey,
    {
      auth: {
        storageKey: clientOptions?.cookieName || config.storage.key,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      cookies: {
        getAll: () => {
          try {
            const cookies = normalizedCookieStore.getAll();
            return cookies || [];
          } catch (error) {
            log('Error getting cookies:', error);
            return [];
          }
        },
        setAll: (cookiesToSet) => {
          try {
            if (typeof normalizedCookieStore.setAll !== 'function') {
              throw new Error('Cookie store does not implement setAll method');
            }
            
            normalizedCookieStore.setAll(
              cookiesToSet.map(({ name, value, options }) => ({
                name,
                value,
                options: {
                  ...config.storage.cookieOptions,
                  ...options,
                },
              }))
            );
          } catch (error) {
            log('Error setting cookies:', error);
            // Attempt to set cookies individually if bulk set fails
            try {
              if (cookieStore && 'set' in cookieStore) {
                const setCookie = (cookieStore as any).set;
                cookiesToSet.forEach(({ name, value, options }) => {
                  setCookie(name, value, {
                    ...config.storage.cookieOptions,
                    ...options,
                  });
                });
              }
            } catch (fallbackError) {
              log('Failed to set cookies with fallback method:', fallbackError);
            }
          }
        },
      },
      global: {
        headers: config.headers,
      },
    }
  );
}

/**
 * Creates a Supabase client for use in Next.js middleware
 * 
 * @param req The Next.js request object
 * @param res The Next.js response object
 * @param options Configuration options
 * @returns A configured Supabase client instance
 */
export async function createSupabaseMiddlewareClient(
  req: NextRequest,
  res: NextResponse,
  options?: ServerClientOptions
): Promise<SupabaseClient<Database>> {
  const cookieStore = createMiddlewareCookieStore(req, res, options?.debug);
  return await createSupabaseServerClient(cookieStore, options);
}

/**
 * Creates a Supabase client for use in Next.js Server Components
 * A convenience wrapper around createSupabaseServerClient
 * 
 * @param cookieStore The cookie store from next/headers
 * @param options Configuration options
 * @returns A configured Supabase client instance
 */
export async function createSupabaseServerComponentClient(
  cookieStore: ReadonlyRequestCookies,
  options?: ServerClientOptions
): Promise<SupabaseClient<Database>> {
  return await createSupabaseServerClient(cookieStore, {
    ...options,
    // Server components are typically read-only for cookies
    // We'll add a warning if debug is enabled
    debug: options?.debug,
  });
}

/**
 * Creates a Supabase client for use in Next.js Server Actions
 * A convenience wrapper around createSupabaseServerClient
 * 
 * @param cookieStore The cookie store from next/headers
 * @param options Configuration options
 * @returns A configured Supabase client instance
 */
export async function createSupabaseServerActionClient(
  cookieStore: ReadonlyRequestCookies,
  options?: ServerClientOptions
): Promise<SupabaseClient<Database>> {
  return await createSupabaseServerClient(cookieStore, options);
}
