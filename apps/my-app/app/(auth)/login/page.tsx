
import LoginForm from '@/components/auth/LoginForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import MagicLinkForm from '@/components/auth/MagicLinkForm';
import Link from 'next/link';
import { getServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  const { message, next } = await searchParams || {};
  const supabase = await getServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // If already logged in, check onboarding status
    const { data: userProfile } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.onboarding_completed) {
      redirect(next || '/dashboard');
    } else if (userProfile) { // Exists but not completed onboarding
      redirect('/onboarding/step1');
    }
    // If profile doesn't exist (shouldn't happen with trigger), they might get stuck or redirect to login again.
    // Middleware should handle this. For safety, if somehow session exists but profile not, login to trigger flow.
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to your account
          </h2>
        </div>

        {message && (
          <p className="text-center p-3 bg-muted text-destructive rounded-md">
            {message}
          </p>
        )}

        <Suspense fallback={<div className="text-center">Loading login options...</div>}>
          <LoginForm redirectTo={next} />
        </Suspense>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Suspense fallback={<div className="text-center">Loading social logins...</div>}>
          <OAuthButtons
            redirectTo={next}
            manualAccountLinking={true}
          />
        </Suspense>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or use a magic link
            </span>
          </div>
        </div>

        <Suspense fallback={<div className="text-center">Loading magic link form...</div>}>
          <MagicLinkForm redirectTo={next} />
        </Suspense>

        <div className="text-sm text-center">
          <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
            Don't have an account? Sign up
          </Link>
        </div>
        <div className="text-sm text-center mt-2">
          <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/90">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
