import { NextRequest, NextResponse } from 'next/server';
import type { AuthMiddlewareConfig, AuthProviderType } from '../types';
export function createAuthMiddleware(config: AuthMiddlewareConfig) {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Check if route should be ignored
    if (config.ignoredRoutes?.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Check if route is public
    const isPublicRoute = config.publicRoutes?.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Check if route is protected
    const isProtectedRoute = config.protectedRoutes?.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    ) ?? false;

    // Handle authentication based on provider
    switch (config.provider) {
      case 'supabase':
        return handleSupabaseAuth(request, config, isProtectedRoute);

      case 'nextauth':
        return handleNextAuthAuth(request, config, isProtectedRoute);

      case 'jwt':
        return handleJWTAuth(request, config, isProtectedRoute);

      case 'basic':
        return handleBasicAuth(request, config, isProtectedRoute);

      case 'better-auth':
        return handleBetterAuth(request, config, isProtectedRoute);

      case 'clerk':
        return handleClerkAuth(request, config, isProtectedRoute);

      default:
        return NextResponse.next();
    }
  };
}

async function handleSupabaseAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  const { createServerClient } = await import('@supabase/ssr');
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
  }

  if (session && request.nextUrl.pathname === (config.redirectTo || '/auth/signin')) {
    return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
  }

  return response;
}

async function handleNextAuthAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  // Check for NextAuth session token
  const token = request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
  }

  if (token && request.nextUrl.pathname === (config.redirectTo || '/auth/signin')) {
    return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
  }

  return NextResponse.next();
}

async function handleJWTAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ||
    request.cookies.get('auth-token')?.value;

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
  }

  if (token) {
    try {
      // Verify JWT token
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);

      // Token is valid, allow access to sign in page redirect
      if (request.nextUrl.pathname === (config.redirectTo || '/auth/signin')) {
        return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
      }
    } catch {
      // Invalid token, remove it and redirect if on protected route
      const response = NextResponse.next();
      response.cookies.delete('auth-token');

      if (isProtectedRoute) {
        return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
      }
    }
  }

  return NextResponse.next();
}

async function handleBasicAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  const session = request.cookies.get('basic-auth-session')?.value;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
  }

  if (session) {
    try {
      const sessionData = JSON.parse(session);
      const now = Date.now();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

      if (now - sessionData.lastActivity > sessionTimeout) {
        // Session expired
        const response = NextResponse.next();
        response.cookies.delete('basic-auth-session');

        if (isProtectedRoute) {
          return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
        }
      } else if (request.nextUrl.pathname === (config.redirectTo || '/auth/signin')) {
        return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
      }
    } catch {
      // Invalid session data
      const response = NextResponse.next();
      response.cookies.delete('basic-auth-session');

      if (isProtectedRoute) {
        return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
      }
    }
  }

  return NextResponse.next();
}

async function handleBetterAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  // Better Auth uses cookies for session management
  const sessionToken = request.cookies.get('better-auth.session-token')?.value;

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL(config.redirectTo || '/auth/signin', request.url));
  }

  if (sessionToken && request.nextUrl.pathname === (config.redirectTo || '/auth/signin')) {
    return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
  }

  return NextResponse.next();
}

async function handleClerkAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig,
  isProtectedRoute: boolean
): Promise<NextResponse> {
  // Clerk uses its own middleware, this is a simplified version
  // In practice, you would use @clerk/nextjs/server middleware
  const sessionToken = request.cookies.get('__session')?.value ||
    request.cookies.get('__clerk_db_jwt')?.value;

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL(config.redirectTo || '/sign-in', request.url));
  }

  if (sessionToken && request.nextUrl.pathname === (config.redirectTo || '/sign-in')) {
    return NextResponse.redirect(new URL(config.afterSignIn || '/dashboard', request.url));
  }

  return NextResponse.next();
}

// Example middleware configurations
export const supabaseMiddleware = createAuthMiddleware({
  provider: 'supabase',
  protectedRoutes: ['/dashboard', '/profile', '/admin'],
  publicRoutes: ['/auth', '/api/auth'],
  redirectTo: '/auth/signin',
  afterSignIn: '/dashboard',
  ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
});

export const nextAuthMiddleware = createAuthMiddleware({
  provider: 'nextauth',
  protectedRoutes: ['/dashboard', '/profile'],
  publicRoutes: ['/auth', '/api/auth'],
  redirectTo: '/auth/signin',
  afterSignIn: '/dashboard',
  ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
});

export const jwtMiddleware = createAuthMiddleware({
  provider: 'jwt',
  protectedRoutes: ['/dashboard', '/profile'],
  publicRoutes: ['/auth', '/api/auth'],
  redirectTo: '/auth/signin',
  afterSignIn: '/dashboard',
  ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
});

export const clerkMiddleware = createAuthMiddleware({
  provider: 'clerk',
  protectedRoutes: ['/dashboard', '/profile'],
  publicRoutes: ['/sign-in', '/sign-up', '/api'],
  redirectTo: '/sign-in',
  afterSignIn: '/dashboard',
  ignoredRoutes: ['/api', '/_next', '/favicon.ico'],
});
