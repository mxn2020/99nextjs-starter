import { BaseService } from './base.service'
import { getServerClient, getAdminClient } from '@/lib/supabase'
import type { 
  User, 
  UserInsert, 
  UserUpdate, 
  UpdateProfileForm,
  UserWithAccounts 
} from '@/lib/types'

export class UserService extends BaseService {
  // Public method to get the current authenticated user
  async getCurrentUser(): Promise<User | null> {
    return this.getAuthenticatedUser()
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.getUserById(userId)
  }

  async createUser(userData: UserInsert): Promise<User> {
    this.logInfo('Creating user', { email: userData.email })
    
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      this.logError('Failed to create user', error, userData)
      throw new Error(`Failed to create user: ${error.message}`)
    }

    // Create a personal account for the new user
    await supabase
      .from('accounts')
      .insert({
        name: `${userData.name || userData.email}'s Personal Account`,
        type: 'personal',
        owner_id: data.id,
      })

    // Link user to their personal account
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', data.id)
      .eq('type', 'personal')
      .single()

    if (account) {
      await supabase
        .from('user_accounts')
        .insert({
          user_id: data.id,
          account_id: account.id,
          role: 'owner',
        })
    }

    this.logInfo('User created successfully', { userId: data.id })
    return data
  }

  async updateProfile(userId: string, updates: UpdateProfileForm): Promise<User> {
    this.logInfo('Updating user profile', { userId, updates })
    
    const supabase = await getServerClient()
    
    const updateData: UserUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) {
      updateData.name = updates.name
    }

    if (updates.bio !== undefined) {
      updateData.bio = updates.bio
    }

    if (updates.website !== undefined) {
      updateData.website = updates.website
    }

    if (updates.location !== undefined) {
      updateData.location = updates.location
    }

    if (updates.avatarUrl !== undefined) {
      updateData.avatar_url = updates.avatarUrl
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      this.logError('Failed to update user profile', error, { userId, updates })
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    this.logInfo('User profile updated successfully', { userId })
    return data
  }

  async getUserWithAccounts(userId: string): Promise<UserWithAccounts | null> {
    this.logInfo('Fetching user with accounts', { userId })
    
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_accounts (
          *,
          account:accounts (*)
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      this.logError('Failed to fetch user with accounts', error, { userId })
      return null
    }

    return data as UserWithAccounts
  }

  async getAllUsers(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    // Only admins can fetch all users
    const currentUser = await this.requireAuthenticatedUser()
    if (!await this.isAdmin(currentUser.id)) {
      throw new Error('Insufficient permissions')
    }

    this.logInfo('Fetching all users', { page, limit })
    
    const supabase = await getServerClient()
    
    const offset = (page - 1) * limit

    const [usersQuery, countQuery] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('users')
        .select('id', { count: 'exact' })
    ])

    if (usersQuery.error) {
      this.logError('Failed to fetch users', usersQuery.error, { page, limit })
      throw new Error(`Failed to fetch users: ${usersQuery.error.message}`)
    }

    const total = countQuery.count || 0

    this.logInfo('Users fetched successfully', { count: usersQuery.data.length, total })
    return {
      users: usersQuery.data,
      total,
    }
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    // Only admins can update user roles
    const currentUser = await this.requireAuthenticatedUser()
    if (!await this.isAdmin(currentUser.id)) {
      throw new Error('Insufficient permissions')
    }

    this.logInfo('Updating user role', { userId, role })
    
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      this.logError('Failed to update user role', error, { userId, role })
      throw new Error(`Failed to update user role: ${error.message}`)
    }

    this.logInfo('User role updated successfully', { userId, role })
    return data
  }

  async deleteUser(userId: string): Promise<void> {
    // Only admins can delete users
    const currentUser = await this.requireAuthenticatedUser()
    if (!await this.isAdmin(currentUser.id)) {
      throw new Error('Insufficient permissions')
    }

    this.logInfo('Deleting user', { userId })
    
    const adminClient = getAdminClient()
    
    // Delete from auth.users (this will cascade to our users table via RLS)
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
      this.logError('Failed to delete user', error, { userId })
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    this.logInfo('User deleted successfully', { userId })
  }
}

export const userService = new UserService()
