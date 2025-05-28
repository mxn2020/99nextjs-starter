'use client';
import React, { useCallback } from 'react';
import { ClerkProvider, useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { AuthContext } from '../auth-context';
import { clerkAuthConfig } from './config';
import type { AuthHookResult, AuthConfig, User, SignInOptions, SignUpOptions } from '../../types';
import type { ClerkAuthOptions } from './types';
interface ClerkAuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig & ClerkAuthOptions>;
}
function ClerkAuthContextProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const loading = !isLoaded;
  const user: User | null = clerkUser && isSignedIn ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
    avatar: clerkUser.imageUrl,
    emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
    roles: (clerkUser.publicMetadata as any)?.roles || [],
    permissions: (clerkUser.publicMetadata as any)?.permissions || [],
    metadata: {
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
        username: clerkUser.username,
          publicMetadata: clerkUser.publicMetadata,
            privateMetadata: clerkUser.privateMetadata,
},
  createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : undefined,
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : undefined,
} : null;
const signIn = useCallback(async (options: SignInOptions) => {
  // Clerk handles sign in through its components and redirects
  // This function is mainly for compatibility
  return {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Use Clerk SignIn component or redirect to sign in page',
    },
    redirectTo: clerkAuthConfig.signInUrl,
  };
}, []);
const signUp = useCallback(async (options: SignUpOptions) => {
  // Clerk handles sign up through its components and redirects
  // This function is mainly for compatibility
  return {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Use Clerk SignUp component or redirect to sign up page',
    },
    redirectTo: clerkAuthConfig.signUpUrl,
  };
}, []);
const signOut = useCallback(async () => {
  await clerkSignOut();
}, [clerkSignOut]);
const updateUser = useCallback(async (updates: Partial<User>) => {
  if (!clerkUser) {
    throw new Error('No user signed in');
  }
  try {
    // Update basic user information
    if (updates.name) {
      const [firstName, ...lastNameParts] = updates.name.split(' ');
      await clerkUser.update({
        firstName,
        lastName: lastNameParts.join(' '),
      });
    }

    // Update metadata
    if (updates.metadata) {
      await clerkUser.update({
        publicMetadata: {
          ...clerkUser.publicMetadata,
          ...updates.metadata,
        },
      });
    }

    // Update roles and permissions through metadata
    if (updates.roles || updates.permissions) {
      await clerkUser.update({
        publicMetadata: {
          ...clerkUser.publicMetadata,
          ...(updates.roles && { roles: updates.roles }),
          ...(updates.permissions && { permissions: updates.permissions }),
        },
      });
    }

    // Return updated user
    const updatedClerkUser = await clerkUser.reload();
    return {
      id: updatedClerkUser.id,
      email: updatedClerkUser.emailAddresses[0]?.emailAddress,
      name: updatedClerkUser.fullName || `${updatedClerkUser.firstName} ${updatedClerkUser.lastName}`.trim(),
      avatar: updatedClerkUser.imageUrl,
      emailVerified: updatedClerkUser.emailAddresses[0]?.verification?.status === 'verified',
      roles: (updatedClerkUser.publicMetadata as any)?.roles || [],
      permissions: (updatedClerkUser.publicMetadata as any)?.permissions || [],
      metadata: {
        firstName: updatedClerkUser.firstName,
        lastName: updatedClerkUser.lastName,
        username: updatedClerkUser.username,
        publicMetadata: updatedClerkUser.publicMetadata,
        privateMetadata: updatedClerkUser.privateMetadata,
      },
      createdAt: updatedClerkUser.createdAt ? new Date(updatedClerkUser.createdAt) : undefined,
      updatedAt: updatedClerkUser.updatedAt ? new Date(updatedClerkUser.updatedAt) : undefined,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'User update failed');
  }
}, [clerkUser]);
const contextValue: AuthHookResult = {
  user,
  loading,
  error: null,
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
export function ClerkAuthProvider({ children, config }: ClerkAuthProviderProps) {
  const mergedConfig = { ...clerkAuthConfig, ...config };
  if (!mergedConfig.publishableKey) {
    throw new Error('Clerk publishable key is required');
  }
  return (
    <ClerkProvider
      publishableKey={mergedConfig.publishableKey}
      appearance={mergedConfig.appearance}
      localization={mergedConfig.localization}
      allowedRedirectOrigins={mergedConfig.allowedRedirectOrigins}
      isSatellite={mergedConfig.isSatellite}
      domain={mergedConfig.domain}
      signInFallbackRedirectUrl={mergedConfig.signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={mergedConfig.signUpFallbackRedirectUrl}
    >
      <ClerkAuthContextProvider>
        {children}
      </ClerkAuthContextProvider>
    </ClerkProvider>
  );
}
