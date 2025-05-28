import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/auth/server'
import { getServerClient } from '@/lib/supabase'

// PUT /api/admin/users/[id] - Update user role
export const PUT = withAdminAuth(async (request: NextRequest, context, routeParams) => {
  const { user: currentUser } = context
  const userId = routeParams?.params?.id
  
  // Parse the request body manually
  const body = await request.json()
  
  // Validate role
  if (!body.role || !['user', 'admin'].includes(body.role)) {
    return {
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: 'Role must be either "user" or "admin"'
      }
    }
  }
  
  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Access denied. Admin privileges required.'
      }
    }
  }

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Access denied. Admin privileges required.'
      }
    }
  }

  // Prevent self-demotion
  if (currentUser.id === userId && body.role === 'user') {
    return {
      success: false,
      error: {
        code: 'SELF_DEMOTION_DENIED',
        message: 'You cannot remove your own admin privileges.'
      }
    }
  }

  const supabase = await getServerClient()
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({ 
      role: body.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update user role'
      }
    }
  }

  return {
    success: true,
    data: updatedUser,
  }
})

// DELETE /api/admin/users/[id] - Delete user
export const DELETE = withAdminAuth(async (request: NextRequest, context, routeParams) => {
  const { user: currentUser } = context
  const userId = routeParams?.params?.id
  
  // Prevent self-deletion
  if (currentUser.id === userId) {
    return {
      success: false,
      error: {
        code: 'SELF_DELETION_DENIED',
        message: 'You cannot delete your own account.'
      }
    }
  }

  const supabase = await getServerClient()
  
  // Delete user from database
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (deleteError) {
    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete user'
      }
    }
  }

  return {
    success: true,
    data: {
      message: 'User deleted successfully'
    }
  }
})
