import { logger } from '@99packages/logger'
import { accountService } from '@/lib/services'
import type { Account, AccountWithUsers } from '@/lib/types'

export async function getUserAccounts(userId: string): Promise<Account[]> {
  try {
    return await accountService.getUserAccounts(userId)
  } catch (error) {
    logger.error('Failed to get user accounts', { error, userId })
    return []
  }
}

export async function getAccountWithUsers(accountId: string): Promise<AccountWithUsers | null> {
  try {
    return await accountService.getAccountWithUsers(accountId)
  } catch (error) {
    logger.error('Failed to get account with users', { error, accountId })
    return null
  }
}

export async function getAccountById(accountId: string): Promise<Account | null> {
  try {
    return await accountService.getAccountById(accountId)
  } catch (error) {
    logger.error('Failed to get account by ID', { error, accountId })
    return null
  }
}

export async function hasAccountAccess(userId: string, accountId: string): Promise<boolean> {
  try {
    return await accountService.hasAccountAccess(userId, accountId)
  } catch (error) {
    logger.error('Failed to check account access', { error, userId, accountId })
    return false
  }
}

export async function isAccountOwner(userId: string, accountId: string): Promise<boolean> {
  try {
    return await accountService.isAccountOwner(userId, accountId)
  } catch (error) {
    logger.error('Failed to check account ownership', { error, userId, accountId })
    return false
  }
}
