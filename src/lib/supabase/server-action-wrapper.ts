// src/clients/supabase/server-action-wrapper.ts
'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './server';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { createLogger } from '@/lib/logger';
import { User } from '@supabase/supabase-js';
import { ActionResult } from '../types';

const logger = createLogger({ prefix: 'action-wrapper' });

// Type definition for a server action function
export type ServerAction<Args extends unknown[], Result> = (
  ...args: Args
) => Promise<ActionResult<Result>>;

// Type definition for a server action that requires authentication
export type AuthenticatedServerAction<Args extends unknown[], Result> = (
  user: User, // Pass the authenticated user to the action
  ...args: Args
) => Promise<ActionResult<Result>>;

// Type definition for role-based server actions
export type RoleBasedServerAction<Args extends unknown[], Result> = (
  user: User, // The authenticated user
  ...args: Args
) => Promise<ActionResult<Result>>;

// Role checking function type
export type RoleChecker = (user: User) => Promise<boolean>;

/**
 * Higher-order function to wrap Server Actions with authentication checks.
 * It expects to be called *within* the server action file where `cookies()` is available.
 *
 * @param action The server action function to protect
 * @returns A new server action function that performs auth checks
 */
export async function withAuth<Args extends unknown[], Result>(
  action: AuthenticatedServerAction<Args, Result>,
  options?: {
    /**
     * Custom error message for unauthenticated requests
     */
    unauthenticatedErrorMessage?: string;
    
    /**
     * Custom error code for unauthenticated requests
     */
    unauthenticatedErrorCode?: string;
    
    /**
     * Whether to log authentication errors (default: true)
     */
    logAuthErrors?: boolean;
    
    /**
     * Custom headers to include with Supabase requests
     */
    headers?: Record<string, string>;
  }
): Promise<ServerAction<Args, Result>> {
  return async (...args: Args): Promise<ActionResult<Result>> => {
    let cookieStore: ReadonlyRequestCookies;
    
    // Get the cookie store
    try {
      cookieStore = await cookies();
    } catch (error) {
      logger.error('Failed to get cookies. Ensure this is run within a Server Action.', { error });
      return { 
        success: false, 
        error: { message: 'Internal server error: Cookie access failed.' } 
      };
    }
    
    // Create Supabase client for auth checks
    const supabase = await createSupabaseServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Check if authenticated
    if (authError || !user) {
      const errorMessage = options?.unauthenticatedErrorMessage || 'Authentication required.';
      const errorCode = options?.unauthenticatedErrorCode || 'UNAUTHENTICATED';
      
      if (options?.logAuthErrors !== false) {
        logger.warn('Authentication failed:', { 
          message: authError?.message || 'No user found.',
          path: 'server action',
        });
      }
      
      return { 
        success: false, 
        error: { message: errorMessage, code: errorCode } 
      };
    }
    
    // If authenticated, execute the original action with the user
    try {
      return await action(user, ...args);
    } catch (error) {
      // Catch errors thrown by the wrapped action
      logger.error('Error executing authenticated action:', { error });
      
      const message = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred in the action.';
        
      return { success: false, error: { message } };
    }
  };
}

/**
 * Higher-order function to wrap Server Actions with role-based access control.
 * 
 * @param roleChecker Function that checks if the user has the required role(s)
 * @param action The server action function to protect
 * @returns A new server action function with role-based access control
 */
export async function withRole<Args extends unknown[], Result>(
  roleChecker: RoleChecker,
  action: RoleBasedServerAction<Args, Result>,
  options?: {
    /**
     * Custom error message for unauthorized requests
     */
    unauthorizedErrorMessage?: string;
    
    /**
     * Custom error code for unauthorized requests
     */
    unauthorizedErrorCode?: string;
    
    /**
     * Whether to log authorization errors (default: true)
     */
    logAuthErrors?: boolean;
    
    /**
     * Custom headers to include with Supabase requests
     */
    headers?: Record<string, string>;
  }
): Promise<ServerAction<Args, Result>> {
  // First authenticate the user
  return withAuth(async (user: User, ...args: Args): Promise<ActionResult<Result>> => {
    // Then check role permissions
    if (!(await roleChecker(user))) {
      const errorMessage = options?.unauthorizedErrorMessage || 'You do not have permission to perform this action.';
      const errorCode = options?.unauthorizedErrorCode || 'UNAUTHORIZED';
      
      if (options?.logAuthErrors !== false) {
        logger.warn('Authorization failed:', { 
          userId: user.id,
          path: 'server action',
        });
      }
      
      return { 
        success: false, 
        error: { message: errorMessage, code: errorCode } 
      };
    }
    
    // If authorized, execute the original action
    return action(user, ...args);
  }, options);
}

/**
 * Utility function to create a role checker for a single role
 * 
 * @param role The role to check for
 * @returns A role checker function
 */
export async function hasRole(role: string): Promise<RoleChecker> {
  return async (user: User) => {
    return user.app_metadata?.role === role;
  };
}

/**
 * Utility function to create a role checker for multiple roles
 * 
 * @param roles Array of roles, any of which grants access
 * @returns A role checker function
 */
export async function hasAnyRole(roles: string[]): Promise<RoleChecker> {
  return async (user: User) => {
    return roles.includes(user.app_metadata?.role);
  };
}

/**
 * Creates a role checker that requires the user to have all specified roles
 * 
 * @param roles Array of roles, all of which are required
 * @returns A role checker function
 */
export async function hasAllRoles(roles: string[]): Promise<RoleChecker> {
  return async (user: User) => {
    // If user doesn't have app_metadata.roles as an array, return false
    if (!Array.isArray(user.app_metadata?.roles)) {
      return false;
    }
    
    // Check if all required roles are present
    return roles.every(role => user.app_metadata.roles.includes(role));
  };
}

/**
 * Creates a custom role checker with complex logic
 * 
 * @param checkFn A function that implements custom role checking logic
 * @returns A role checker function
 */
export async function customRoleCheck(checkFn: (user: User) => boolean): Promise<RoleChecker> {
  return async (user: User) => checkFn(user);
}

// Example Usage:
/*
'use server';

import { withAuth, withRole, hasRole, hasAnyRole } from '@workspace/halo-db/supabase/server-action-wrapper';
import { type ActionResult, type User } from '@workspace/halo-db/types';
import { cookies } from 'next/headers';

// Define the core action with authentication only
const updateProfileAction = async (
  user: User, 
  data: { username: string }
): Promise<ActionResult<{ success: boolean }>> => {
  console.log(`Updating profile for user ${user.id} with username ${data.username}`);
  
  // Implementation...
  
  return { success: true, data: { success: true } };
};

// Wrap the action with authentication
export const updateProfile = await withAuth(updateProfileAction);

// Example of a role-restricted action
const adminOnlyAction = async (
  user: User
): Promise<ActionResult<{ adminData: string }>> => {
  // This will only execute if the user has the 'admin' role
  return { 
    success: true, 
    data: { adminData: `Secret admin data for ${user.id}` } 
  };
};

// Create an admin-only server action
export const getAdminData = await withRole(
  hasRole('admin'),
  adminOnlyAction,
  { 
    unauthorizedErrorMessage: 'Admin access required'
  }
);

// Multiple roles example
export const getModeratorData = await withRole(
  hasAnyRole(['admin', 'moderator']),
  async (user: User): Promise<ActionResult<{ moderatorData: string }>> => {
    return { 
      success: true, 
      data: { moderatorData: `Moderator data for ${user.id}` } 
    };
  }
);
*/

