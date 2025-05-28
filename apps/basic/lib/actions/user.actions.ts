'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logger } from '@99packages/logger'
import { userService } from '@/lib/services'
import { updateProfileFormSchema } from '@/lib/schemas'
import type { UpdateProfileForm } from '@/lib/types'

export async function updateUserProfile(data: UpdateProfileForm) {
  try {
    logger.info('Server action: updateUserProfile', { data })
    
    const validatedData = updateProfileFormSchema.parse(data)
    
    const currentUser = await userService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Authentication required')
    }

    const updatedUser = await userService.updateProfile(currentUser.id, validatedData)
    
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    logger.error('Failed to update user profile', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  try {
    logger.info('Server action: updateUserRole', { userId, role })
    
    const updatedUser = await userService.updateUserRole(userId, role)
    
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/users')
    
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
    
    await userService.deleteUser(userId)
    
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/users')
    
    return {
      success: true,
    }
  } catch (error) {
    logger.error('Failed to delete user', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}
