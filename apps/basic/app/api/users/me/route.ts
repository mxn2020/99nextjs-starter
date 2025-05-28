import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/server'
import { userService } from '@/lib/services'

// GET /api/users/me - Get current user
export const GET = withAuth(async (request: NextRequest, context) => {
  const { user } = context
  
  return {
    success: true,
    data: user,
  }
})

// PUT /api/users/me - Update current user profile
export const PUT = withAuth(async (request: NextRequest, context) => {
  const { user: currentUser } = context
  
  let body
  try {
    body = await request.json()
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    }
  }

  // Manual validation
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.length === 0)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name must be a non-empty string'
      }
    }
  }

  if (body.avatarUrl !== undefined && typeof body.avatarUrl !== 'string') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Avatar URL must be a string'
      }
    }
  }

  try {
    const result = await userService.updateProfile(currentUser.id, body)
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update profile'
      }
    }
  }
})
