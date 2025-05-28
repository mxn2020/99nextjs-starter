'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseAuth } from '@99packages/auth/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const auth = createSupabaseAuth();
      const supabase = (auth as any).supabase;
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error.message);
        router.push('/auth/signin?error=callback_error');
      } else if (data.session) {
        router.push('/dashboard');
      } else {
        router.push('/auth/signin');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
}