// src/clients/supabase/keys.ts
import { z } from 'zod';

/**
 * Schema for Supabase client configuration
 */
const supabaseConfigSchema = z.object({
  // Base configuration (required)
  url: z.string({
    description: 'URL of your Supabase instance',
    required_error: 'NEXT_PUBLIC_SUPABASE_URL environment variable is required',
  }).url('Invalid Supabase URL format'),
  
  anonKey: z.string({
    description: 'Anonymous API key for client-side Supabase access',
    required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required',
  }).min(1, 'Anon key cannot be empty'),
  
  // Service role key (optional for admin operations)
  serviceRoleKey: z.string({
    description: 'Service role key for admin-level Supabase access (server-side only)',
  }).optional(),
  
  // Auth storage configuration
  storage: z.object({
    // Storage key for auth tokens
    key: z.string({
      description: 'Storage key name for the Supabase Auth Token',
    }).default(process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'),
    
    // Cookie name for server-side auth
    cookieName: z.string({
      description: 'Cookie name for server-side authentication',
    }).default(process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'),
    
    // Cookie options
    cookieOptions: z.object({
      // Common cookie options
      secure: z.boolean().default(true),
      sameSite: z.enum(['strict', 'lax', 'none']).default('lax'),
      domain: z.string().optional(),
      path: z.string().default('/'),
      maxAge: z.number().default(60 * 60 * 24 * 7), // 1 week default
    }).optional(),
  }).optional().default({}),
  
  // Custom headers (optional)
  headers: z.record(z.string()).optional(),
  
  // Debug mode (optional)
  debug: z.boolean().optional(),
});

/**
 * Type for Supabase client configuration
 */
export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;

/**
 * Returns and validates the Supabase client configuration from environment variables.
 * Provides strong typing, validation, and sensible defaults.
 * 
 * @param overrides Optional manual overrides for the configuration
 * @returns Validated Supabase configuration object
 */
export function getSupabaseConfig(overrides?: Partial<SupabaseConfig>): SupabaseConfig {
  const tokenStorageKey = process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key'

  // Get environment variables with fallbacks
  const configFromEnv = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    storage: {
      key: tokenStorageKey,
      cookieName: tokenStorageKey,
    },
    debug: process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true',
  };

 
  // Merge with overrides
  const mergedConfig = { ...configFromEnv, ...overrides };
  
  // Validate and return
  try {
    return supabaseConfigSchema.parse(mergedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => 
        `- ${e.path.join('.')}: ${e.message}`
      ).join('\n');
      
      throw new Error(
        `Invalid Supabase configuration:\n${formattedErrors}\n\n` +
        `Make sure all required environment variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Helper function to get just the URL and anon key (most common use case)
 */
export function getSupabaseClientKeys() {
  const config = getSupabaseConfig();
  return {
    url: config.url,
    anonKey: config.anonKey,
    storageKey: config.storage.key,
  };
}

/**
 * Helper function to get admin keys (URL and service role key)
 * @throws Error if the service role key is not available
 */
export function getSupabaseAdminKeys() {
  const config = getSupabaseConfig();
  
  if (!config.serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations'
    );
  }
  
  return {
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
  };
}
