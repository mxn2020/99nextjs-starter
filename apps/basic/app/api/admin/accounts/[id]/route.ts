import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/auth/server'
import { getServerClient } from '@/lib/supabase'

// GET /api/admin/accounts/[id] - Get account details with members
export const GET = withAdminAuth(async (request: NextRequest, context, routeParams) => {
  const accountId = routeParams?.params?.id

  const supabase = await getServerClient()
  
  const { data: account, error } = await supabase
    .from('accounts')
    .select(`
      *,
      owner:users!accounts_owner_id_fkey(id, name, email),
      user_accounts(
        *,
        user:users(id, name, email, role)
      )
    `)
    .eq('id', accountId)
    .single()

  if (error) {
    return Response.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Account not found'
      }
    }, { status: 404 })
  }

  return Response.json({
    success: true,
    data: account,
  })
})

// DELETE /api/admin/accounts/[id] - Delete account
export const DELETE = withAdminAuth(async (request: NextRequest, context, routeParams) => {
  const accountId = routeParams?.params?.id

  const supabase = await getServerClient()
  
  // Check if account has any notes or important data
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id')
    .eq('account_id', accountId)
    .limit(1)

  if (notesError) {
    return {
      success: false,
      error: {
        code: 'DEPENDENCY_CHECK_FAILED',
        message: 'Failed to check account dependencies'
      }
    }
  }

  if (notes && notes.length > 0) {
    return {
      success: false,
      error: {
        code: 'DEPENDENCIES_EXIST',
        message: 'Cannot delete account with existing notes. Please delete or transfer notes first.'
      }
    }
  }

  // Delete the account (this will cascade delete user_accounts due to foreign key constraints)
  const { error: deleteError } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)

  if (deleteError) {
    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete account'
      }
    }
  }

  return {
    success: true,
    data: {
      message: 'Account deleted successfully'
    }
  }
})
