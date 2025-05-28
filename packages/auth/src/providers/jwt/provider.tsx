'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../auth-context';
import { createJWTAuth } from './client';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions } from '../../types';
import type { JWTAuthOptions } from './types';
interface JWTAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & JWTAuthOptions>;
}
export function JWTAuthProvider({ children, config }: JWTAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jwtClient] = useState(() => createJWTAuth(config));
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await jwtClient.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [jwtClient]);
  const signIn = useCallback(async (options: SignInOptions) => {
    setLoading(true);
    setError(null);
    const result = await jwtClient.signIn(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [jwtClient]);
  const signUp = useCallback(async (options: SignUpOptions) => {
    setLoading(true);
    setError(null);
    const result = await jwtClient.signUp(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [jwtClient]);
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await jwtClient.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }

    setLoading(false);
  }, [jwtClient]);
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await jwtClient.resetPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [jwtClient]);
  const updateUser = useCallback(async (updates: Partial<User>) => {
    setError(null);
    try {
      const updatedUser = await jwtClient.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [jwtClient]);
  const refreshToken = useCallback(async () => {
    const result = await jwtClient.refreshToken();
    if (result.error) {
      setError(result.error.message);
      if (result.error.code === 'REFRESH_FAILED') {
        setUser(null); // Force re-authentication
      }
    } else if (result.user) {
      setUser(result.user);
    }

    return result;
  }, [jwtClient]);
  const contextValue: AuthHookResult = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
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
