
// Path: app/auth/callback/route.ts
// Note: some Supabase docs put this in /api/auth/callback/route.ts. Ensure consistency with your OAuth provider redirect URI settings.
// For this example, we'll use /auth/callback/route.ts based on common Supabase examples.
// If you use /api/auth/callback, update middleware and Supabase dashboard settings.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'; // Default to dashboard

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if profile exists, if not, user might be new from OAuth
      // The handle_new_user trigger should create a profile.
      // We can then check onboarding status.
      const { data: userProfile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', data.session.user.id)
        .single();

      if (userProfile && !userProfile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding/step1`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('OAuth callback error:', error.message);
    // Redirect to an error page or login page with an error message
    return NextResponse.redirect(`${origin}/login?message=Authentication failed: ${encodeURIComponent(error.message)}`);
  }

  // return the user to an error page with instructions
  console.error('OAuth callback: No code found in request.');
  return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Authentication failed: No code provided.')}`);
}
