import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { DefaultDatabase } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientKeys } from './keys';

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

  // Use standardized key functions
  const { url, anonKey } = getSupabaseClientKeys();

  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<TDatabase>(url, anonKey, {
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