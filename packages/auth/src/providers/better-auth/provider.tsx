'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../auth-context';
import { createBetterAuth } from './client';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions, OAuthSignInOptions } from '../../types';
import type { BetterAuthOptions } from './types';
interface BetterAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & BetterAuthOptions>;
}
export function BetterAuthProvider({ children, config }: BetterAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betterClient] = useState(() => createBetterAuth(config));
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await betterClient.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error initializing Better Auth:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [betterClient]);
  const signIn = useCallback(async (options: SignInOptions) => {
    setLoading(true);
    setError(null);
    const result = await betterClient.signIn(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [betterClient]);
  const signUp = useCallback(async (options: SignUpOptions) => {
    setLoading(true);
    setError(null);
    const result = await betterClient.signUp(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [betterClient]);
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await betterClient.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }

    setLoading(false);
  }, [betterClient]);
  const signInWithOAuth = useCallback(async (options: OAuthSignInOptions) => {
    setError(null);
    const result = await betterClient.signInWithOAuth(options);
    if (result.error) {
      setError(result.error.message);
    }

    return result;
  }, [betterClient]);
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await betterClient.resetPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [betterClient]);
  const updateUser = useCallback(async (updates: Partial<User>) => {
    setError(null);
    try {
      const updatedUser = await betterClient.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [betterClient]);
  const refreshToken = useCallback(async () => {
    const result = await betterClient.refreshToken();
    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    return result;
  }, [betterClient]);
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
