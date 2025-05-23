// src/lib/supabase/server.ts - Server client
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export async function createSupabaseServerClient(cookieStore?: Awaited<ReturnType<typeof cookies>>) {
  const cookieStoreToUse = cookieStore || await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStoreToUse.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStoreToUse.set({ name, value, ...options });
          } catch (error) {
            // Handle cases where cookies can't be set (e.g., in middleware)
            console.warn('Could not set cookie:', name, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStoreToUse.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cases where cookies can't be removed
            console.warn('Could not remove cookie:', name, error);
          }
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false, // Handled by middleware
        persistSession: false, // Server-side doesn't persist
        debug: process.env.NODE_ENV === 'development',
      },
    }
  );
}

// Middleware-specific client
export async function createSupabaseMiddlewareClient(request: Request, response: Response) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')
            ?.split(';')
            .find(c => c.trim().startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=${value}; Path=/; ${options.secure ? 'Secure;' : ''} ${options.httpOnly ? 'HttpOnly;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`);
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.secure ? 'Secure;' : ''} ${options.httpOnly ? 'HttpOnly;' : ''}`);
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        debug: process.env.NODE_ENV === 'development',
      },
    }
  );
}