
import SignupForm from '@/components/auth/SignupForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import Link from 'next/link';
import { getServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ message?: string, next?: string }> }) {
  const { message, next } = await searchParams || {};

  const supabase = await getServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect(next || '/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
        </div>

        {message && (
          <p className="text-center p-3 bg-muted text-destructive rounded-md">
            {message}
          </p>
        )}

        <Suspense fallback={<div className="text-center">Loading signup form...</div>}>
          <SignupForm redirectTo={next} />
        </Suspense>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>

        <Suspense fallback={<div className="text-center">Loading social logins...</div>}>
          <OAuthButtons
            redirectTo={next}
            isSignUp
            manualAccountLinking={true}
          />
        </Suspense>


        <div className="text-sm text-center">
          <Link href="/login" className="font-medium text-primary hover:text-primary/90">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
