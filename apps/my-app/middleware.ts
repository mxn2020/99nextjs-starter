import { NextResponse, type NextRequest } from 'next/server';
import { getMiddleWareClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = getMiddleWareClient(request);

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
    // Check if user is trying to access auth pages when already authenticated
    if ((pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // For better performance, only fetch user profile when accessing protected routes
    // that require onboarding or role checks
    const needsProfileCheck = !publicPaths.some(path => pathname.startsWith(path)) || 
                             pathname.startsWith('/admin') ||
                             (!pathname.startsWith('/onboarding') && !pathname.startsWith('/auth'));

    if (needsProfileCheck) {
      // Fetch user profile to check onboarding status and role
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

      // RBAC: Protect admin routes
      if (pathname.startsWith('/admin')) {
        if (!userProfile || userProfile.role !== 'admin') {
          // If not admin, redirect to dashboard or an unauthorized page
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
        }
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
     * - favicon.ico, robots.txt, sitemap.xml (static files)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
