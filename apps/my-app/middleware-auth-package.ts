// Using the auth package middleware (alternative approach)
import { createAuthMiddleware } from '@99packages/auth/middleware';

export const middleware = createAuthMiddleware({
  provider: 'supabase',
  
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
    '/onboarding',
  ],
  
  // Public routes (accessible without authentication)
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/auth/callback',
    '/forgot-password',
    '/api/auth/callback',
  ],
  
  // Routes to completely ignore (no auth check)
  ignoredRoutes: [
    '/api/webhook',
    '/api/health',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  
  // Redirect configuration
  redirects: {
    signIn: '/login',
    afterSignIn: '/dashboard',
    afterSignOut: '/',
  },
  
  // Custom role checks
  roleChecks: {
    '/admin': ['admin'],
  },
  
  // Onboarding redirect
  onboardingCheck: {
    enabled: true,
    redirectTo: '/onboarding/step1',
    excludePaths: ['/onboarding', '/auth', '/api'],
  },
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
