import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/services'
import type { User } from '@/lib/types'

// Custom auth wrapper that uses our user service
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: { user: User }, routeParams?: any) => Promise<T>
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse<T>> => {
    try {
      // Get user from our user service (which integrates with Supabase)
      const user = await userService.getCurrentUser()
      
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        ) as NextResponse<T>
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin privileges required'
            }
          },
          { status: 403 }
        ) as NextResponse<T>
      }

      const context = { user }
      const result = await handler(request, context, routeContext)
      return NextResponse.json(result) as NextResponse<T>

    } catch (error) {
      console.error('Auth error:', error)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      ) as NextResponse<T>
    }
  }
}

// Custom auth wrapper for general authentication (not just admin)
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: User }, routeParams?: any) => Promise<T>
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse<T>> => {
    try {
      // Get user from our user service (which integrates with Supabase)
      const user = await userService.getCurrentUser()
      
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        ) as NextResponse<T>
      }

      const context = { user }
      const result = await handler(request, context, routeContext)
      return NextResponse.json(result) as NextResponse<T>

    } catch (error) {
      console.error('Auth error:', error)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      ) as NextResponse<T>
    }
  }
}
