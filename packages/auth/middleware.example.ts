import { createAuthMiddleware } from '@99packages/auth/middleware';
// Example middleware configuration for different auth providers
// Supabase middleware
export const middleware = createAuthMiddleware({
provider: 'supabase',
protectedRoutes: [
'/dashboard',
'/profile',
'/admin',
'/settings',
],
publicRoutes: [
'/auth/signin',
'/auth/signup',
'/auth/reset-password',
'/auth/callback',
'/api/auth',
],
redirectTo: '/auth/signin',
afterSignIn: '/dashboard',
ignoredRoutes: [
'/api',
'/_next',
'/favicon.ico',
'/robots.txt',
'/sitemap.xml',
],
});
// NextAuth middleware
// export const middleware = createAuthMiddleware({
//   provider: 'nextauth',
//   protectedRoutes: ['/dashboard', '/profile'],
//   publicRoutes: ['/auth', '/api/auth'],
//   redirectTo: '/auth/signin',
//   afterSignIn: '/dashboard',
//   ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
// });
// JWT middleware
// export const middleware = createAuthMiddleware({
//   provider: 'jwt',
//   protectedRoutes: ['/dashboard', '/profile'],
//   publicRoutes: ['/auth', '/api/auth'],
//   redirectTo: '/auth/signin',
//   afterSignIn: '/dashboard',
//   ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
// });
// Clerk middleware
// export const middleware = createAuthMiddleware({
//   provider: 'clerk',
//   protectedRoutes: ['/dashboard', '/profile'],
//   publicRoutes: ['/sign-in', '/sign-up', '/api'],
//   redirectTo: '/sign-in',
//   afterSignIn: '/dashboard',
//   ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
// });
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png∣.∗.jpg|.*\\.jpg
∣.∗.jpg|.*\\.jpeg∣.∗.gif|.*\\.gif
∣.∗.gif|.*\\.svg$).*)',
  ],
};
