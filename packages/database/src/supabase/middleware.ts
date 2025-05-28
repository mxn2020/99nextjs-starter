import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { DefaultDatabase } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseMiddlewareClient<TDatabase = DefaultDatabase>(
  request: NextRequest
): {
  supabase: SupabaseClient<TDatabase>,
  response: NextResponse;
} {
  if (!request) {
    throw new Error('Request object is required');
  }
  if (!(request instanceof NextRequest)) {
    throw new Error('Invalid request object, expected NextRequest');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or anon key is not set in environment variables');
  }
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase URL or anon key');
  }

  const supabase = createServerClient<TDatabase>(url, key, {
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
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  return { supabase, response };
}