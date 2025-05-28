// src/app/auth/callback/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { getAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const errorMessage = errorDescription || error;
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(`Authentication failed: ${errorMessage}`)}`);
  }

  if (!code) {
    console.error('OAuth callback: No code found in request.');
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Authentication failed: No authorization code provided.')}`);
  }

  try {
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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(`Authentication failed: ${exchangeError.message}`)}`);
    }

    if (!data.session || !data.user) {
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Authentication failed: Invalid session.')}`);
    }

    // Check for potential account conflicts
    const userEmail = data.user.email;
    if (userEmail) {
      const supabaseAdmin = getAdminClient();
      
      // Check if there's already a different user with this email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const conflictingUser = existingUsers.users?.find(u => 
        u.email === userEmail && u.id !== data.user.id
      );

      if (conflictingUser) {
        // Handle account conflict - redirect to account linking page
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/link-accounts?email=${encodeURIComponent(userEmail)}&conflict=true`);
      }
    }

    // Check if profile exists
    const { data: userProfile } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', data.session.user.id)
      .single();

    if (userProfile && !userProfile.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding/step1`);
    }

    return NextResponse.redirect(`${origin}${next}`);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(`Authentication failed: ${error.message || 'Unknown error'}`)}`);
  }
}

