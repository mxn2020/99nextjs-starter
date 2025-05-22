// src/clients/supabase/auth.ts
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { createSupabaseBrowserClient } from './client';
import { createSupabaseServerClient } from './server';
import { createLogger } from '@/lib/logger';

// Import Supabase auth types for convenience re-export
import type {
  AuthError,
  AuthResponse,
  AuthTokenResponse,
  SignInWithPasswordCredentials,
  SignInWithOAuthCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';

// Re-export Supabase auth types for consumers
export type {
  AuthError,
  AuthResponse,
  AuthTokenResponse,
  SignInWithPasswordCredentials,
  SignInWithOAuthCredentials,
  SignUpWithPasswordCredentials
};

const logger = createLogger({ prefix: 'auth' });

/**
 * Common options for auth operations
 */
export interface AuthOptions {
  /**
   * Whether to suppress error logging
   */
  silentMode?: boolean;
  
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
 * Result of an authentication operation
 */
export interface AuthResult<T> {
  /**
   * The resulting data
   */
  data: T | null;
  
  /**
   * Error object if the operation failed
   */
  error: Error | null;
}

/**
 * Enhanced result from user retrieval
 */
export interface UserResult {
  /**
   * The authenticated user if available
   */
  user: User | null;
  
  /**
   * The user's session if available
   */
  session: Session | null;
  
  /**
   * Error object if the operation failed
   */
  error: Error | null;
}

/**
 * Retrieves the current authenticated user on the server-side.
 * Requires a Next.js compatible cookie store.
 *
 * @param cookieStore The cookie store from `next/headers`
 * @param options Additional options
 * @returns An object containing the user, session, or an error
 */
export async function getCurrentUserServer(
  options?: AuthOptions
): Promise<UserResult> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Getting current user from server');
  
  const supabase = await createSupabaseServerClient(undefined, {
    headers: options?.headers,
    debug
  });
  
  try {
    // Get the user data
    const { data, error } = await supabase.auth.getUser();
    if (error && !options?.silentMode) throw error;
    
    // Get session data
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError && !options?.silentMode) throw sessionError;
    
    log('User data retrieved', { 
      hasUser: !!data?.user, 
      hasSession: !!sessionData?.session 
    });
    
    return { 
      user: data?.user ?? null, 
      session: sessionData?.session ?? null, 
      error: error || sessionError || null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown auth error";
    
    // Only log errors if not in silent mode
    if (!options?.silentMode) {
      logger.error("Error fetching user:", { errorMessage });
    }
    
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Retrieves the current authenticated user on the client-side (browser).
 * Uses the singleton browser client.
 *
 * @param options Additional options
 * @returns An object containing the user, session, or an error
 */
export async function getCurrentUserBrowser(
  options?: AuthOptions
): Promise<UserResult> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Getting current user from browser');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    // Get both user and session for consistency
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    log('User data retrieved', { 
      hasUser: !!userData?.user, 
      hasSession: !!sessionData?.session 
    });
    
    return { 
      user: userData?.user ?? null, 
      session: sessionData?.session ?? null, 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown auth error";
      
    if (!options?.silentMode) {
      logger.error("Error fetching user:", { errorMessage });
    }
    
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Signs in a user with email and password.
 *
 * @param credentials The user credentials
 * @param options Additional options
 * @returns An authentication result
 */
export async function signInWithPassword(
  credentials: SignInWithPasswordCredentials,
  options?: AuthOptions
): Promise<AuthResult<Session>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Signing in with password');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    
    log('Sign-in successful');
    
    return { 
      data: data.session, 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown sign-in error";
      
    if (!options?.silentMode) {
      logger.error("Error signing in:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Signs up a new user with email and password.
 *
 * @param credentials The user credentials
 * @param options Additional options
 * @returns An authentication result
 */
export async function signUpWithPassword(
  credentials: SignUpWithPasswordCredentials,
  options?: AuthOptions
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Signing up with password');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { data, error } = await supabase.auth.signUp(credentials);
    if (error) throw error;
    
    log('Sign-up successful', { 
      emailConfirm: !data.session,
      userId: data.user?.id 
    });
    
    return { 
      data: { 
        user: data.user, 
        session: data.session 
      }, 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown sign-up error";
      
    if (!options?.silentMode) {
      logger.error("Error signing up:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Signs in a user using a third-party OAuth provider.
 *
 * @param provider The OAuth provider to use
 * @param options Additional options including OAuth-specific options
 * @returns An authentication result (typically redirects the user)
 */
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'twitter' | 'discord' | 'facebook' | 'spotify' | 'slack' | 'notion' | 'apple',
  options?: AuthOptions & {
    /**
     * The URL to redirect to after successful sign-in
     */
    redirectTo?: string;
    
    /**
     * Whether to use PKCE flow
     */
    skipBrowserRedirect?: boolean;
    
    /**
     * Scopes to request
     */
    scopes?: string;
  }
): Promise<AuthResult<{ provider: string; url: string }>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Signing in with OAuth provider', { provider });
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo,
        skipBrowserRedirect: options?.skipBrowserRedirect,
        scopes: options?.scopes,
      }
    });
    
    if (error) throw error;
    
    log('OAuth sign-in initiated', { url: data.url });
    
    return { 
      data: { 
        provider, 
        url: data.url 
      }, 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown OAuth sign-in error";
      
    if (!options?.silentMode) {
      logger.error("Error signing in with OAuth:", { 
        provider, 
        errorMessage 
      });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Signs out the current user.
 * Works in browser environment.
 *
 * @param options Additional options
 * @returns A result indicating success or failure
 */
export async function signOutBrowser(
  options?: AuthOptions
): Promise<AuthResult<boolean>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Signing out from browser');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    log('Sign-out successful');
    
    return { data: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown sign-out error";
      
    if (!options?.silentMode) {
      logger.error("Error signing out:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Signs out the current user from the server.
 * Requires a Next.js compatible cookie store.
 *
 * @param cookieStore The cookie store from `next/headers`
 * @param options Additional options
 * @returns A result indicating success or failure
 */
export async function signOutServer(
  options?: AuthOptions
): Promise<AuthResult<boolean>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Signing out from server');
  
  const supabase = await createSupabaseServerClient(undefined, {
    headers: options?.headers,
    debug
  });
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    log('Sign-out successful');
    
    return { data: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown sign-out error";
      
    if (!options?.silentMode) {
      logger.error("Error signing out:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Sends a password reset email to the specified email address.
 *
 * @param email The user's email address
 * @param options Additional options
 * @returns A result indicating success or failure
 */
export async function resetPassword(
  email: string,
  options?: AuthOptions & {
    /**
     * The URL to redirect to after successful password reset
     */
    redirectTo?: string;
  }
): Promise<AuthResult<boolean>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Sending password reset email');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo
    });
    
    if (error) throw error;
    
    log('Password reset email sent');
    
    return { data: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown password reset error";
      
    if (!options?.silentMode) {
      logger.error("Error sending password reset:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Updates the current user's profile.
 *
 * @param userData The user data to update
 * @param options Additional options
 * @returns The updated user or an error
 */
export async function updateUserProfile(
  userData: {
    email?: string;
    password?: string;
    data?: Record<string, any>;
  },
  options?: AuthOptions
): Promise<AuthResult<User>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Updating user profile');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { data, error } = await supabase.auth.updateUser(userData);
    if (error) throw error;
    
    log('User profile updated');
    
    return { data: data.user, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown profile update error";
      
    if (!options?.silentMode) {
      logger.error("Error updating user profile:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Refreshes the current user's session.
 * Useful for updating the session token or extending its validity.
 *
 * @param options Additional options
 * @returns The refreshed session or an error
 */
export async function refreshSession(
  options?: AuthOptions
): Promise<AuthResult<Session>> {
  const debug = !!options?.debug;
  const log = debug ? 
    (...args: Parameters<typeof logger.debug>) => logger.debug(...args) : 
    () => {};
    
  log('Refreshing user session');
  
  const supabase = createSupabaseBrowserClient({
    headers: options?.headers,
    debug
  });
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    log('Session refreshed');
    
    return { data: data.session, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      "Unknown session refresh error";
      
    if (!options?.silentMode) {
      logger.error("Error refreshing session:", { errorMessage });
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}