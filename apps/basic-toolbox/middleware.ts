import { createAuthMiddleware } from '@99packages/auth/middleware'

export const middleware = createAuthMiddleware({
  provider: 'supabase',
  
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/notes',
    '/admin',
  ],
  
  // Public routes (accessible without authentication)
  publicRoutes: [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/error',
    '/auth/reset-password',
  ],
  
  // Routes to ignore completely
  ignoredRoutes: [
    '/api/webhook',
    '/api/public',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  
  // Redirect configuration
  redirectTo: '/auth/signin',
  afterSignIn: '/dashboard',
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with static extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
