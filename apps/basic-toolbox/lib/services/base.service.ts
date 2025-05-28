import { logger } from '@99packages/logger'
import { getServerClient, getAdminClient } from '@/lib/supabase'
import type { User, QueryOptions, PaginatedResponse } from '@/lib/types'

export abstract class BaseService {
  protected async getAuthenticatedUser(): Promise<User | null> {
    try {
      const supabase = await getServerClient()
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        logger.warn('No authenticated user found', { error })
        return null
      }

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logger.warn('Failed to fetch user profile, falling back to auth user data', { 
          error: profileError, 
          userId: user.id 
        })
        
        // Return a basic user object using auth data as fallback
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
          bio: '',
          website: '', 
          location:  '',
          role: 'user', // default role
          email_verified: !!user.email_confirmed_at,
          created_at: (new Date(user.created_at)).toISOString(),
          updated_at: (new Date(user.updated_at || user.created_at)).toISOString(),
        } as User
      }

      return profile
    } catch (error) {
      logger.error('Error getting authenticated user', { error })
      return null
    }
  }

  protected async requireAuthenticatedUser(): Promise<User> {
    const user = await this.getAuthenticatedUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }

  protected async isAdmin(userId?: string): Promise<boolean> {
    const user = userId ? 
      await this.getUserById(userId) : 
      await this.getAuthenticatedUser()
    
    return user?.role === 'admin'
  }

  protected async getUserById(id: string): Promise<User | null> {
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Failed to fetch user by ID', { error, userId: id })
      return null
    }

    return data
  }

  protected buildPaginatedResponse<T>(
    data: T[],
    options: QueryOptions,
    total: number
  ): PaginatedResponse<T> {
    const page = options.page || 1
    const limit = options.limit || 10
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  protected logError(operation: string, error: any, context?: any) {
    logger.error(`Service error: ${operation}`, { error, context })
  }

  protected logInfo(operation: string, context?: any) {
    logger.info(`Service operation: ${operation}`, context)
  }
}
