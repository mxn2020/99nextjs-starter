'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../auth-context';
import { createSupabaseAuth } from './client';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions, OAuthSignInOptions } from '../../types';
import type { SupabaseAuthOptions } from './types';

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & SupabaseAuthOptions>;
}

export function SupabaseAuthProvider({ children, config }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseClient] = useState(() => createSupabaseAuth(config));

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await supabaseClient.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.error('Error getting initial session:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      setError(null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseClient]);

  const signIn = useCallback(async (options: SignInOptions) => {
    setLoading(true);
    setError(null);
    const result = await supabaseClient.signIn(options);

    if (result.error) {
      setError(result.error.message);
    }

    setLoading(false);
    return result;
  }, [supabaseClient]);

  const signUp = useCallback(async (options: SignUpOptions) => {
    setLoading(true);
    setError(null);
    const result = await supabaseClient.signUp(options);

    if (result.error) {
      setError(result.error.message);
    }

    setLoading(false);
    return result;
  }, [supabaseClient]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabaseClient.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }

    setLoading(false);
  }, [supabaseClient]);

  const signInWithOAuth = useCallback(async (options: OAuthSignInOptions) => {
    setError(null);
    const result = await supabaseClient.signInWithOAuth(options);
    if (result.error) {
      setError(result.error.message);
    }

    return result;
  }, [supabaseClient]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await supabaseClient.resetPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [supabaseClient]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setError(null);
    try {
      const updatedUser = await supabaseClient.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [supabaseClient]);

  const refreshToken = useCallback(async () => {
    const result = await supabaseClient.refreshToken();
    if (result.error) {
      setError(result.error.message);
    }

    return result;
  }, [supabaseClient]);

  const contextValue: AuthHookResult = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
