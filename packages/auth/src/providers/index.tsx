'use client';
import React, { useEffect, useState } from 'react';
import { AuthContext } from './auth-context';
import { SupabaseAuthProvider } from './supabase/provider';
import { NextAuthProvider } from './nextauth/provider';
import { JWTAuthProvider } from './jwt/provider';
import { BasicAuthProvider } from './basic/provider';
import { BetterAuthProvider } from './better-auth/provider';
import { ClerkAuthProvider } from './clerk/provider';
import type { AuthProviderType, AuthConfig } from '../types';

interface AuthProviderProps {
  children: React.ReactNode;
  provider: AuthProviderType;
  config?: Partial<AuthConfig>;
}
export function AuthProvider({ children, provider, config }: AuthProviderProps) {

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  switch (provider) {
    case 'supabase':
      return <SupabaseAuthProvider config={config}>{children}</SupabaseAuthProvider>;
    case 'nextauth':
      return <NextAuthProvider config={config}>{children}</NextAuthProvider>;

    case 'jwt':
      return <JWTAuthProvider config={config}>{children}</JWTAuthProvider>;

    case 'basic':
      return <BasicAuthProvider config={config}>{children}</BasicAuthProvider>;

    case 'better-auth':
      return <BetterAuthProvider config={config}>{children}</BetterAuthProvider>;

    case 'clerk':
      return <ClerkAuthProvider config={config}>{children}</ClerkAuthProvider>;

    default:
      throw new Error(`Unsupported auth provider: ${provider}`);
  }

}

// Individual provider exports
export { SupabaseAuthProvider } from './supabase/provider';
export { NextAuthProvider } from './nextauth/provider';
export { JWTAuthProvider } from './jwt/provider';
export { BasicAuthProvider } from './basic/provider';
export { BetterAuthProvider } from './better-auth/provider';
export { ClerkAuthProvider } from './clerk/provider';
