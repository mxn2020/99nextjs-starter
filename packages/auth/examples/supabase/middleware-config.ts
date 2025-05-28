// Middleware configuration for Supabase authentication
// This file shows how to set up route protection with Supabase

import { createAuthMiddleware } from '@99packages/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Basic middleware configuration
export const middleware = createAuthMiddleware({
  // Specify the authentication provider
  provider: 'supabase',
  
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
    '/user',
  ],
  
  // Public routes (accessible without authentication)
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password',
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
    signIn: '/auth/signin',
    afterSignIn: '/dashboard',
    afterSignOut: '/',
    unauthorized: '/auth/signin?error=unauthorized',
  },
});

// Advanced middleware configuration with role-based access
export const advancedMiddleware = createAuthMiddleware({
  provider: 'supabase',
  
  // Protected routes with role requirements
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
  ],
  
  // Admin-only routes
  adminRoutes: [
    '/admin',
    '/admin/*',
  ],
  
  // Moderator routes
  moderatorRoutes: [
    '/moderation',
    '/reports',
  ],
  
  publicRoutes: [
    '/',
    '/auth/*',
  ],
  
  ignoredRoutes: [
    '/api/webhook/*',
    '/_next/*',
    '/static/*',
  ],
  
  redirects: {
    signIn: '/auth/signin',
    afterSignIn: '/dashboard',
    afterSignOut: '/',
    unauthorized: '/auth/signin',
    forbidden: '/403',
  },
  
  // Custom authorization logic
  customAuthorization: async (request: NextRequest, user: any) => {
    const { pathname } = request.nextUrl;
    
    // Admin routes require admin role
    if (pathname.startsWith('/admin')) {
      return user?.roles?.includes('admin') || false;
    }
    
    // Moderation routes require moderator or admin role
    if (pathname.startsWith('/moderation') || pathname.startsWith('/reports')) {
      return user?.roles?.some((role: string) => ['admin', 'moderator'].includes(role)) || false;
    }
    
    // API routes might have different requirements
    if (pathname.startsWith('/api/admin')) {
      return user?.roles?.includes('admin') || false;
    }
    
    // Default: authenticated user can access
    return true;
  },
});

// Matcher configuration for Next.js
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Custom middleware function for specific use cases
export function createCustomSupabaseMiddleware() {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip auth for certain paths
    const publicPaths = ['/auth', '/api/public'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    
    // Get user from Supabase
    try {
      // Import Supabase client for middleware
      const { createSupabaseMiddlewareClient } = await import('@99packages/database/supabase/middleware');
      const supabase = createSupabaseMiddlewareClient(request);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Redirect to login for protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
          const redirectUrl = new URL('/auth/signin', request.url);
          redirectUrl.searchParams.set('redirectTo', pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
      
      // Add user to request headers for server components
      const response = NextResponse.next();
      if (user) {
        response.headers.set('x-user-id', user.id);
        response.headers.set('x-user-email', user.email || '');
      }
      
      return response;
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.next();
    }
  };
}

// Role-based middleware example
export function createRoleBasedMiddleware() {
  return createAuthMiddleware({
    provider: 'supabase',
    
    protectedRoutes: ['/dashboard', '/profile'],
    publicRoutes: ['/auth/*', '/'],
    
    // Custom role checking
    customAuthorization: async (request, user) => {
      const { pathname } = request.nextUrl;
      
      // Check user roles from database
      if (pathname.startsWith('/admin')) {
        return hasRole(user, 'admin');
      }
      
      if (pathname.startsWith('/moderator')) {
        return hasRole(user, 'moderator') || hasRole(user, 'admin');
      }
      
      // API key protection for certain API routes
      if (pathname.startsWith('/api/admin')) {
        const apiKey = request.headers.get('x-api-key');
        return apiKey === process.env.ADMIN_API_KEY;
      }
      
      return true; // Allow access for authenticated users
    },
    
    redirects: {
      signIn: '/auth/signin',
      forbidden: '/403',
      afterSignIn: (user) => {
        // Dynamic redirect based on user role
        if (hasRole(user, 'admin')) return '/admin/dashboard';
        if (hasRole(user, 'moderator')) return '/moderator/dashboard';
        return '/dashboard';
      },
    },
  });
}

// Helper function to check user roles
function hasRole(user: any, role: string): boolean {
  return user?.app_metadata?.roles?.includes(role) || 
         user?.roles?.includes(role) || 
         false;
}

// Example of API route protection
export function createAPIMiddleware() {
  return async function middleware(request: NextRequest) {
    // Only apply to API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // Skip auth for public API routes
    const publicAPIs = ['/api/health', '/api/webhook'];
    if (publicAPIs.some(api => request.nextUrl.pathname.startsWith(api))) {
      return NextResponse.next();
    }
    
    try {
      const { createSupabaseMiddlewareClient } = await import('@99packages/database/supabase/middleware');
      const supabase = createSupabaseMiddlewareClient(request);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Add user context to headers
      const response = NextResponse.next();
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      
      return response;
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Usage examples:

/*
// Basic usage in middleware.ts:
export { middleware, config } from '@99packages/auth/examples/supabase/middleware-config';

// Or advanced usage:
import { advancedMiddleware as middleware, config } from '@99packages/auth/examples/supabase/middleware-config';
export { middleware, config };

// Or custom middleware:
import { createCustomSupabaseMiddleware } from '@99packages/auth/examples/supabase/middleware-config';
export const middleware = createCustomSupabaseMiddleware();

// Separate middleware for different route patterns:
import { createAPIMiddleware, createRoleBasedMiddleware } from '@99packages/auth/examples/supabase/middleware-config';

export function middleware(request: NextRequest) {
  // API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return createAPIMiddleware()(request);
  }
  
  // Web routes
  return createRoleBasedMiddleware()(request);
}
*/
