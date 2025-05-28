'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@99packages/logger'
import { userService } from '@/lib/services'
import { getServerClient } from '@/lib/supabase'

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  try {
    logger.info('Server action: updateUserRole', { userId, role })
    
    const currentUser = await userService.getCurrentUser()
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    // Prevent self-demotion
    if (currentUser.id === userId && role === 'user') {
      throw new Error('You cannot remove your own admin privileges.')
    }

    const supabase = await getServerClient()
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update user role', error, { userId, role })
      throw new Error('Failed to update user role')
    }

    revalidatePath('/admin')
    revalidatePath('/admin/users')
    
    logger.info('User role updated successfully', { userId, role })
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    logger.error('Failed to update user role', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    logger.info('Server action: deleteUser', { userId })
    
    const currentUser = await userService.getCurrentUser()
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      throw new Error('You cannot delete your own account.')
    }

    const supabase = await getServerClient()
    
    // Delete user from database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      logger.error('Failed to delete user', deleteError, { userId })
      throw new Error('Failed to delete user')
    }

    revalidatePath('/admin')
    revalidatePath('/admin/users')
    
    logger.info('User deleted successfully', { userId })
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    logger.error('Failed to delete user', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}

export async function deleteAccount(accountId: string) {
  try {
    logger.info('Server action: deleteAccount', { accountId })
    
    const currentUser = await userService.getCurrentUser()
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    const supabase = await getServerClient()
    
    // Check if account has any notes or important data
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)

    if (notesError) {
      logger.error('Failed to check account dependencies', notesError, { accountId })
      throw new Error('Failed to check account dependencies')
    }

    if (notes && notes.length > 0) {
      throw new Error('Cannot delete account with existing notes. Please delete or transfer notes first.')
    }

    // Delete the account (this will cascade delete user_accounts due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      logger.error('Failed to delete account', deleteError, { accountId })
      throw new Error('Failed to delete account')
    }

    revalidatePath('/admin')
    revalidatePath('/admin/accounts')
    revalidatePath('/dashboard/accounts')
    
    logger.info('Account deleted successfully', { accountId })
    return {
      success: true,
      message: 'Account deleted successfully',
    }
  } catch (error) {
    logger.error('Failed to delete account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account',
    }
  }
}

export async function getAdminStats() {
  try {
    logger.info('Server action: getAdminStats')
    
    const currentUser = await userService.getCurrentUser()
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    const supabase = await getServerClient()
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total accounts
    const { count: totalAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })

    // Get total notes
    const { count: totalNotes } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get accounts created in the last 30 days
    const { count: recentAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get notes created in the last 30 days
    const { count: recentNotes } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    logger.info('Admin stats fetched successfully')
    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalAccounts: totalAccounts || 0,
        totalNotes: totalNotes || 0,
        recentUsers: recentUsers || 0,
        recentAccounts: recentAccounts || 0,
        recentNotes: recentNotes || 0,
        systemHealth: {
          status: 'healthy',
          uptime: '99.8%',
          lastBackup: new Date().toISOString(),
        },
      },
    }
  } catch (error) {
    logger.error('Failed to fetch admin stats', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch admin statistics',
    }
  }
}
