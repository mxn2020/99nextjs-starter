'use client'

import { getBrowserClient } from '@/lib/supabase-client'
import type { 
  User, 
  UserInsert, 
  UserUpdate, 
  UpdateProfileForm,
  ApiResponse 
} from '@/lib/types'

class UserMutations {
  private supabase = getBrowserClient()

  async updateProfile(data: UpdateProfileForm): Promise<ApiResponse<User>> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Authentication required',
        }
      }

      const updateData: UserUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (data.name !== undefined) {
        updateData.name = data.name
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio
      }

      if (data.website !== undefined) {
        updateData.website = data.website
      }

      if (data.location !== undefined) {
        updateData.location = data.location
      }

      if (data.avatarUrl !== undefined) {
        updateData.avatar_url = data.avatarUrl
      }

      const { data: updatedUser, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        data: updatedUser,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'No authenticated user',
        }
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
      }
    }
  }

  async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }
    }
  }
}

export const userMutations = new UserMutations()
