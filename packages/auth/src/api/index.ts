import { NextRequest, NextResponse } from 'next/server';
import type { User, AuthApiOptions, AuthProviderType } from '../types';
import { AuthError } from '../errors';

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

export interface ApiContext {
  user: User;
  session?: any;
}

export function withAuth<T = any>(
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse<T>>,
  options: AuthApiOptions = {}
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse<T>> => {
    try {
      // Extract user from request based on provider
      const user = await getUserFromRequest(request, options.provider);
      if (options.requireAuth !== false && !user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        ) as NextResponse<T>;
      }

      // Check roles if required
      if (options.requiredRole && user) {
        const requiredRoles = Array.isArray(options.requiredRole)
          ? options.requiredRole
          : [options.requiredRole];

        const hasRole = requiredRoles.some(role => user.roles?.includes(role));
        if (!hasRole) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            },
            { status: 403 }
          ) as NextResponse<T>;
        }
      }

      // Check permissions if required
      if (options.requiredPermissions && user) {
        const requiredPermissions = Array.isArray(options.requiredPermissions)
          ? options.requiredPermissions
          : [options.requiredPermissions];

        const hasPermission = requiredPermissions.some(permission =>
          user.permissions?.includes(permission)
        );

        if (!hasPermission) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            },
            { status: 403 }
          ) as NextResponse<T>;
        }
      }

      const context: ApiContext = { user: user! };
      return await handler(request, context);

    } catch (error) {
      console.error('Auth middleware error:', error);

      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message
            }
          },
          { status: error.statusCode }
        ) as NextResponse<T>;
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

export function createAuthHandler(handlers: Record<string, Function>) {
  return async (request: NextRequest) => {
    const provider = request.headers.get('x-auth-provider') || 'default';
    const handler = handlers[provider] || handlers.default;
    if (!handler) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_SUPPORTED',
            message: `Auth provider '${provider}' not supported`
          }
        },
        { status: 400 }
      );
    }

    try {
      const body = await request.json();
      const result = await handler(body);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Auth handler error:', error);

      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message
            }
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        },
        { status: 500 }
      );
    }
  };
}

async function getUserFromRequest(
  request: NextRequest,
  provider?: AuthProviderType
): Promise<User | null> {
  switch (provider) {
    case 'supabase':
      return getUserFromSupabase(request);
    case 'nextauth':
      return getUserFromNextAuth(request);

    case 'jwt':
      return getUserFromJWT(request);

    case 'basic':
      return getUserFromBasicAuth(request);

    case 'better-auth':
      return getUserFromBetterAuth(request);

    case 'clerk':
      return getUserFromClerk(request);

    default:
      // Try to detect provider automatically
      return await autoDetectUser(request);
  }
}

async function getUserFromSupabase(request: NextRequest): Promise<User | null> {
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() { },
          remove() { },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
      emailVerified: !!user.email_confirmed_at,
      roles: user.app_metadata?.roles || [],
      permissions: user.app_metadata?.permissions || [],
      metadata: user.user_metadata,
    };
  } catch {
    return null;
  }
}

async function getUserFromNextAuth(request: NextRequest): Promise<User | null> {
  // TODO: Implement NextAuth user extraction from server
  // This would require decoding the JWT token or querying the session
  return null;
}
async function getUserFromJWT(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.sub!,
      email: payload.email as string,
      name: payload.name as string,
      roles: payload.roles as string[] || [],
      permissions: payload.permissions as string[] || [],
    };
  } catch {
    return null;
  }
}

async function getUserFromBasicAuth(request: NextRequest): Promise<User | null> {
  try {
    const sessionCookie = request.cookies.get('basic-auth-session')?.value;
    if (!sessionCookie) return null;
    const sessionData = JSON.parse(sessionCookie);
    const now = Date.now();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

    if (now - sessionData.lastActivity > sessionTimeout) {
      return null;
    }

    return {
      id: sessionData.user.username,
      email: sessionData.user.email,
      name: sessionData.user.name || sessionData.user.username,
      roles: sessionData.user.roles || [],
      permissions: sessionData.user.permissions || [],
    };
  } catch {
    return null;
  }
}

async function getUserFromBetterAuth(request: NextRequest): Promise<User | null> {
  try {
    // TODO: Implement Better Auth user extraction
    // This would require calling Better Auth's session endpoint
    const sessionToken = request.cookies.get('better-auth.session-token')?.value;
    if (!sessionToken) return null;
    // In a real implementation, you would verify this with Better Auth
    return null;
  } catch {
    return null;
  }
}

async function getUserFromClerk(request: NextRequest): Promise<User | null> {
  try {
    // TODO: Implement Clerk user extraction
    // This would require using Clerk's server-side utilities
    const sessionToken = request.cookies.get('__session')?.value;
    if (!sessionToken) return null;
    // In a real implementation, you would verify this with Clerk
    return null;
  } catch {
    return null;
  }
}

async function autoDetectUser(request: NextRequest): Promise<User | null> {
  // Try different auth methods in order of preference
  const methods = [
    () => getUserFromSupabase(request),
    () => getUserFromJWT(request),
    () => getUserFromNextAuth(request),
    () => getUserFromBasicAuth(request),
    () => getUserFromBetterAuth(request),
    () => getUserFromClerk(request),
  ];
  for (const method of methods) {
    try {
      const user = await method();
      if (user) return user;
    } catch {
      continue;
    }
  }
  return null;
}
