'use client';
import React from 'react';
import { useAuth } from '../hooks';

interface SignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
  onSignOut?: () => void;
}

export function SignOutButton({ children, className, onSignOut }: SignOutButtonProps) {
  const { signOut, loading } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };
  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {children || (loading ? 'Signing out...' : 'Sign out')}
    </button>
  );
}
interface OAuthButtonProps {
  provider: 'google' | 'github' | 'discord' | 'facebook' | 'twitter' | 'apple';
  children?: React.ReactNode;
  className?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
export function OAuthButton({
  provider,
  children,
  className,
  redirectTo,
  onSuccess,
  onError
}: OAuthButtonProps) {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const handleOAuthSignIn = async () => {
    if (!signInWithOAuth) {
      onError?.('OAuth sign in not supported');
      return;
    }
    setLoading(true);

    try {
      const result = await signInWithOAuth({
        provider,
        redirectTo,
      });

      if (result.error) {
        onError?.(result.error.message);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'OAuth sign in failed');
    } finally {
      setLoading(false);
    }
  };
  const getProviderName = () => {
    switch (provider) {
      case 'google': return 'Google';
      case 'github': return 'GitHub';
      case 'discord': return 'Discord';
      case 'facebook': return 'Facebook';
      case 'twitter': return 'Twitter';
      case 'apple': return 'Apple';
      default: return provider;
    }
  };
  return (
    <button
      onClick={handleOAuthSignIn}
      disabled={loading}
      className={className}
    >
      {children || (loading ? `Signing in with ${getProviderName()}...` : `Sign in with ${getProviderName()}`)}
    </button>
  );
}
interface AuthStateButtonProps {
  signedInContent?: React.ReactNode;
  signedOutContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  className?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
}
export function AuthStateButton({
  signedInContent,
  signedOutContent,
  loadingContent,
  className,
  onSignIn,
  onSignOut,
}: AuthStateButtonProps) {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className={className}>
        {loadingContent || 'Loading...'}
      </div>
    );
  }
  if (user) {
    return (
      <button
        onClick={async () => {
          await signOut();
          onSignOut?.();
        }}
        className={className}
      >
        {signedInContent || `Sign out (${user.email})`}
      </button>
    );
  }
  return (
    <button
      onClick={onSignIn}
      className={className}
    >
      {signedOutContent || 'Sign in'}
    </button>
  );
}
// Provider-specific buttons
export function GoogleSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="google" />;
}
export function GitHubSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="github" />;
}
export function DiscordSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="discord" />;
}
export function FacebookSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="facebook" />;
}
export function TwitterSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="twitter" />;
}
export function AppleSignInButton(props: Omit<OAuthButtonProps, 'provider'>) {
  return <OAuthButton {...props} provider="apple" />;
}
