'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../auth-context';
import { createBasicAuth } from './client';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions } from '../../types';
import type { BasicAuthOptions } from './types';

interface BasicAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & BasicAuthOptions>;
}

export function BasicAuthProvider({ children, config }: BasicAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [basicClient] = useState(() => createBasicAuth(config));
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await basicClient.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error initializing basic auth:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [basicClient]);
  const signIn = useCallback(async (options: SignInOptions) => {
    setLoading(true);
    setError(null);
    const result = await basicClient.signIn(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [basicClient]);

  const signUp = useCallback(async (options: SignUpOptions) => {
    setLoading(true);
    setError(null);

    const result = await basicClient.signUp(options);

    if (result.error) {
      setError(result.error.message);
    } else if (result.user) {
      setUser(result.user);
    }

    setLoading(false);
    return result;
  }, [basicClient]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await basicClient.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }

    setLoading(false);
  }, [basicClient]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setError(null);

    try {
      const updatedUser = await basicClient.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [basicClient]);

  const contextValue: AuthHookResult = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
