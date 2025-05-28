'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logger } from '@99packages/logger'
import { accountService } from '@/lib/services'
import { createAccountFormSchema } from '@/lib/schemas'
import type { CreateAccountForm } from '@/lib/types'

export async function createAccount(data: CreateAccountForm) {
  try {
    logger.info('Server action: createAccount', { data })
    
    const validatedData = createAccountFormSchema.parse(data)
    
    const account = await accountService.createAccount(validatedData)
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    
    return {
      success: true,
      data: account,
    }
  } catch (error) {
    logger.error('Failed to create account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    }
  }
}

export async function updateAccount(accountId: string, data: Partial<CreateAccountForm>) {
  try {
    logger.info('Server action: updateAccount', { accountId, data })
    
    const account = await accountService.updateAccount(accountId, data)
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${accountId}`)
    
    return {
      success: true,
      data: account,
    }
  } catch (error) {
    logger.error('Failed to update account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account',
    }
  }
}

export async function addUserToAccount(accountId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member') {
  try {
    logger.info('Server action: addUserToAccount', { accountId, userId, role })
    
    const userAccount = await accountService.addUserToAccount(accountId, userId, role)
    
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${accountId}`)
    
    return {
      success: true,
      data: userAccount,
    }
  } catch (error) {
    logger.error('Failed to add user to account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add user to account',
    }
  }
}

export async function removeUserFromAccount(accountId: string, userId: string) {
  try {
    logger.info('Server action: removeUserFromAccount', { accountId, userId })
    
    await accountService.removeUserFromAccount(accountId, userId)
    
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${accountId}`)
    
    return {
      success: true,
    }
  } catch (error) {
    logger.error('Failed to remove user from account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove user from account',
    }
  }
}

export async function deleteAccount(accountId: string) {
  try {
    logger.info('Server action: deleteAccount', { accountId })
    
    await accountService.deleteAccount(accountId)
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    
    return {
      success: true,
    }
  } catch (error) {
    logger.error('Failed to delete account', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account',
    }
  }
}
