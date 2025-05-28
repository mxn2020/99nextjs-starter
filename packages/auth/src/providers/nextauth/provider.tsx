'use client';
import React, { useCallback } from 'react';
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { AuthContext } from '../auth-context';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions, OAuthSignInOptions } from '../../types';
import type { NextAuthOptions } from './types';
interface NextAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & NextAuthOptions>;
}
function NextAuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const user: User | null = session?.user ? {
    id: (session.user as any).id || '',
    email: session.user.email || undefined,
    name: session.user.name || undefined,
    avatar: session.user.image || undefined,
    roles: (session.user as any).roles || [],
    permissions: (session.user as any).permissions || [],
    emailVerified: (session.user as any).emailVerified || false,
    metadata: (session.user as any).metadata || {},
  } : null;
  const signIn = useCallback(async (options: SignInOptions) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email: options.email,
        password: options.password,
        redirect: false
      });

      if (result?.error) {
        return {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: result.error,
          },
        };
      }

      return {
        user: user,
        redirectTo: options.redirectTo,
      };
    } catch (error) {
      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Sign in failed',
        },
      };
    }
  }, [user]);

  const signUp = useCallback(async (options: SignUpOptions) => {
    // TODO: Implement sign up logic
    // NextAuth doesn't have built-in sign up, so this would need to be implemented
    // You might want to call your own API endpoint here
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: 'SIGNUP_FAILED',
            message: data.message || 'Sign up failed',
          },
        };
      }

      // After successful signup, sign in the user
      return await signIn({
        email: options.email,
        password: options.password,
      });
    } catch (error) {
      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Sign up failed',
        },
      };
    }
  }, [signIn]);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
  }, []);

  const signInWithOAuth = useCallback(async (options: OAuthSignInOptions) => {
    try {
      const result = await nextAuthSignIn(options.provider, {
        redirect: false,
        callbackUrl: options.redirectTo,
      });

      if (result?.error) {
        return {
          error: {
            code: 'OAUTH_ERROR',
            message: result.error,
          },
        };
      }

      return {
        redirectTo: result?.url,
      };
    } catch (error) {
      return {
        error: {
          code: 'OAUTH_ERROR',
          message: error instanceof Error ? error.message : 'OAuth sign in failed',
        },
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // TODO: Implement password reset
    // This would typically call your own API endpoint
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Password reset failed');
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    // TODO: Implement user update
    // This would typically call your own API endpoint
    const response = await fetch('/api/auth/update-user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'User update failed');
    }

    const updatedUser = await response.json();
    return updatedUser;
  }, []);

  const contextValue: AuthHookResult = {
    user,
    loading,
    error: null,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function NextAuthProvider({ children, config }: NextAuthProviderProps) {
  return (
    <SessionProvider>
      <NextAuthContextProvider>
        {children}
      </NextAuthContextProvider>
    </SessionProvider>
  );
}
