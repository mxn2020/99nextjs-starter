import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }

  if (code) {
    try {
      const supabase = await getServerClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
      }
      
      // Successful authentication - redirect to the intended destination
      return NextResponse.redirect(new URL(next, request.url))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }
  }

  // No code parameter, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
