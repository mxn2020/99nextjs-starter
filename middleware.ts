import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './src/lib/supabase/server';

export async function middleware(request: NextRequest, response: NextResponse) {
  const supabase = await createSupabaseMiddlewareClient(request, response);

  // Refresh session if expired - required for Server Components
  // https://www.google.com/search?q=https://supabase.com/docs/guides/auth/auth-helpers/nextjs%23managing-session-with-middleware
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/forgot-password', '/api/auth/callback']; // Added /api/auth/callback

  // If the user is not authenticated and trying to access a protected route
  if (!session && !publicPaths.some(path => pathname.startsWith(path))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname); // Store intended path
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is authenticated
  if (session) {
    // Fetch user profile to check onboarding status and role
    // This might be slightly inefficient to do on every request for protected routes.
    // Consider storing essential profile info (like onboarding_completed, role) in the session's user_metadata or app_metadata if possible,
    // or use a lighter check. For this example, we fetch the profile.
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('onboarding_completed, role')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows, user profile might not exist yet
      console.error('Middleware: Error fetching user profile:', profileError);
      // Allow access but log error, or redirect to an error page
    }

    // Redirect to onboarding if not completed and not already on an onboarding path or auth path
    if (userProfile && !userProfile.onboarding_completed && !pathname.startsWith('/onboarding') && !publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/onboarding/step1', request.url));
    }

    // If user is authenticated and onboarding is complete, but tries to access login/signup, redirect to dashboard
    if ((pathname === '/login' || pathname === '/signup') && userProfile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // RBAC: Protect admin routes
    if (pathname.startsWith('/admin')) {
      if (!userProfile || userProfile.role !== 'admin') {
        // If not admin, redirect to dashboard or an unauthorized page
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
    * Match all request paths except for the ones starting with:
    * - _next/static (static files)
    * - _next/image (image optimization files)
    * - favicon.ico (favicon file)
    * Feel free to modify this pattern to include more paths.
    */
    '/((?!_next/static|_next/image|favicon.ico|..(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
