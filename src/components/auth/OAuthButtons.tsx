"use client";

import { useState } from 'react';
import { loginWithOAuth, linkOAuthAccount } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

interface OAuthButtonsProps {
  redirectTo?: string;
  isSignUp?: boolean;
  manualAccountLinking: boolean; // New prop for account linking mode
}

export default function OAuthButtons({ redirectTo, isSignUp = false, manualAccountLinking = false }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoadingProvider(provider);
    
    try {
      let result;
      if (manualAccountLinking) {
        result = await linkOAuthAccount(provider);
      } else {
        result = await loginWithOAuth(provider, redirectTo);
      }
      
      // Only handle actual errors, not redirects
      if (result?.error && result.error !== 'NEXT_REDIRECT') {
        toast.error(`${manualAccountLinking ? 'Account linking' : 'Authentication'} failed: ${result.error}`);
        setLoadingProvider(null);
      }
      // If result.error === 'NEXT_REDIRECT' or no error, the redirect is happening successfully
      // Don't clear loading state as the page will change
    } catch (error: any) {
      // Only catch actual errors, not Next.js redirects
      if (error?.message !== 'NEXT_REDIRECT' && !error?.digest?.includes('NEXT_REDIRECT')) {
        console.error('OAuth error:', error);
        toast.error(`${manualAccountLinking ? 'Account linking' : 'Authentication'} failed: ${error.message || 'Unknown error'}`);
        setLoadingProvider(null);
      }
      // If it's a NEXT_REDIRECT error, let it continue (this is expected behavior)
    }
  };

  const getButtonText = (provider: string) => {
    if (manualAccountLinking) return `Link ${provider}`;
    return isSignUp ? `Sign up with ${provider}` : `Continue with ${provider}`;
  };

  const getProviderIcon = (provider: 'github' | 'google') => {
    return provider === 'github' ? FaGithub : FaGoogle;
  };

  const providers: Array<{ key: 'github' | 'google'; name: string }> = [
    { key: 'github', name: 'GitHub' },
    { key: 'google', name: 'Google' },
  ];

  return (
    <div className="space-y-3">
      {providers.map(({ key, name }) => {
        const Icon = getProviderIcon(key);
        const isLoading = loadingProvider === key;
        
        return (
          <Button
            key={key}
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth(key)}
            disabled={loadingProvider !== null}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-5 w-5" />
            )}
            {isLoading ? `Connecting to ${name}...` : getButtonText(name)}
          </Button>
        );
      })}
    </div>
  );
}