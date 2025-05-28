// Alternative optimized middleware using app_metadata
import { NextResponse, type NextRequest } from 'next/server';
import { getMiddleWareClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = getMiddleWareClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/forgot-password', '/api/auth/callback'];

  // If the user is not authenticated and trying to access a protected route
  if (!session && !publicPaths.some(path => pathname.startsWith(path))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is authenticated
  if (session) {
    // Check if user is trying to access auth pages when already authenticated
    if ((pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Use app_metadata for performance (if you store user info there)
    const userMetadata = session.user.app_metadata || {};
    const onboardingCompleted = userMetadata.onboarding_completed || false;
    const userRole = userMetadata.role || 'user';

    // Redirect to onboarding if not completed
    if (!onboardingCompleted && !pathname.startsWith('/onboarding') && !publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/onboarding/step1', request.url));
    }

    // RBAC: Protect admin routes
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
