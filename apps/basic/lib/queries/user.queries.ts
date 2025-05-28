import { logger } from '@99packages/logger'
import { userService } from '@/lib/services'
import type { User, UserWithAccounts, QueryOptions } from '@/lib/types'

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await userService.getCurrentUser()
  } catch (error) {
    logger.error('Failed to get current user', { error })
    return null
  }
}

export async function getUserWithAccounts(userId: string): Promise<UserWithAccounts | null> {
  try {
    return await userService.getUserWithAccounts(userId)
  } catch (error) {
    logger.error('Failed to get user with accounts', { error, userId })
    return null
  }
}

export async function getAllUsers(page = 1, limit = 10): Promise<{ users: User[]; total: number } | null> {
  try {
    return await userService.getAllUsers(page, limit)
  } catch (error) {
    logger.error('Failed to get all users', { error, page, limit })
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await userService.getUserById(userId)
  } catch (error) {
    logger.error('Failed to get user by ID', { error, userId })
    return null
  }
}
