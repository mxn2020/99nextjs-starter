import { BaseService } from './base.service'
import { getServerClient } from '@/lib/supabase'
import type { 
  Account, 
  AccountInsert, 
  AccountUpdate, 
  AccountWithUsers,
  CreateAccountForm,
  AccountType,
  UserAccount,
  UserAccountInsert 
} from '@/lib/types'

export class AccountService extends BaseService {
  async createAccount(accountData: CreateAccountForm): Promise<Account> {
    const currentUser = await this.requireAuthenticatedUser()
    
    this.logInfo('Creating account', { ...accountData, userId: currentUser.id })
    
    const supabase = await getServerClient()
    
    // Enterprise accounts can only be created by admins
    if (accountData.type === 'enterprise' && !await this.isAdmin(currentUser.id)) {
      throw new Error('Only administrators can create enterprise accounts')
    }

    const insertData: AccountInsert = {
      name: accountData.name,
      type: accountData.type,
      owner_id: currentUser.id,
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      this.logError('Failed to create account', error, insertData)
      throw new Error(`Failed to create account: ${error.message}`)
    }

    // Add the creator as the owner
    await this.addUserToAccount(data.id, currentUser.id, 'owner')

    this.logInfo('Account created successfully', { accountId: data.id })
    return data
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    this.logInfo('Fetching user accounts', { userId })
    
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('user_accounts')
      .select(`
        account:accounts (*)
      `)
      .eq('user_id', userId)

    if (error) {
      this.logError('Failed to fetch user accounts', error, { userId })
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }

    const accounts = data.map(item => item.account).filter(Boolean) as Account[]
    
    this.logInfo('User accounts fetched successfully', { userId, count: accounts.length })
    return accounts
  }

  async getAccountWithUsers(accountId: string): Promise<AccountWithUsers | null> {
    const currentUser = await this.requireAuthenticatedUser()
    
    // Check if user has access to this account
    const hasAccess = await this.hasAccountAccess(currentUser.id, accountId)
    if (!hasAccess && !await this.isAdmin(currentUser.id)) {
      throw new Error('Access denied to this account')
    }

    this.logInfo('Fetching account with users', { accountId })
    
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        user_accounts (
          *,
          user:users (*)
        )
      `)
      .eq('id', accountId)
      .single()

    if (error) {
      this.logError('Failed to fetch account with users', error, { accountId })
      return null
    }

    return data as AccountWithUsers
  }

  async updateAccount(accountId: string, updates: Partial<AccountUpdate>): Promise<Account> {
    const currentUser = await this.requireAuthenticatedUser()
    
    // Check if user is owner or admin
    const isOwner = await this.isAccountOwner(currentUser.id, accountId)
    const isAdmin = await this.isAdmin(currentUser.id)
    
    if (!isOwner && !isAdmin) {
      throw new Error('Only account owners or administrators can update accounts')
    }

    this.logInfo('Updating account', { accountId, updates })
    
    const supabase = await getServerClient()
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single()

    if (error) {
      this.logError('Failed to update account', error, { accountId, updates })
      throw new Error(`Failed to update account: ${error.message}`)
    }

    this.logInfo('Account updated successfully', { accountId })
    return data
  }

  async addUserToAccount(accountId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<UserAccount> {
    const currentUser = await this.requireAuthenticatedUser()
    
    // Check if current user can add users to this account
    const isOwnerOrAdmin = await this.isAccountOwnerOrAdmin(currentUser.id, accountId)
    const isSystemAdmin = await this.isAdmin(currentUser.id)
    
    if (!isOwnerOrAdmin && !isSystemAdmin) {
      throw new Error('Insufficient permissions to add users to this account')
    }

    this.logInfo('Adding user to account', { accountId, userId, role })
    
    const supabase = await getServerClient()
    
    const insertData: UserAccountInsert = {
      user_id: userId,
      account_id: accountId,
      role,
    }

    const { data, error } = await supabase
      .from('user_accounts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      this.logError('Failed to add user to account', error, insertData)
      throw new Error(`Failed to add user to account: ${error.message}`)
    }

    this.logInfo('User added to account successfully', { accountId, userId, role })
    return data
  }

  async removeUserFromAccount(accountId: string, userId: string): Promise<void> {
    const currentUser = await this.requireAuthenticatedUser()
    
    // Check permissions
    const isOwnerOrAdmin = await this.isAccountOwnerOrAdmin(currentUser.id, accountId)
    const isSystemAdmin = await this.isAdmin(currentUser.id)
    const isSelfRemoval = currentUser.id === userId
    
    if (!isOwnerOrAdmin && !isSystemAdmin && !isSelfRemoval) {
      throw new Error('Insufficient permissions to remove user from account')
    }

    // Prevent removing the last owner
    const ownerCount = await this.getAccountOwnerCount(accountId)
    const isUserOwner = await this.isAccountOwner(userId, accountId)
    
    if (isUserOwner && ownerCount <= 1) {
      throw new Error('Cannot remove the last owner from an account')
    }

    this.logInfo('Removing user from account', { accountId, userId })
    
    const supabase = await getServerClient()
    
    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('account_id', accountId)
      .eq('user_id', userId)

    if (error) {
      this.logError('Failed to remove user from account', error, { accountId, userId })
      throw new Error(`Failed to remove user from account: ${error.message}`)
    }

    this.logInfo('User removed from account successfully', { accountId, userId })
  }

  async deleteAccount(accountId: string): Promise<void> {
    const currentUser = await this.requireAuthenticatedUser()
    
    // Only account owners or system admins can delete accounts
    const isOwner = await this.isAccountOwner(currentUser.id, accountId)
    const isAdmin = await this.isAdmin(currentUser.id)
    
    if (!isOwner && !isAdmin) {
      throw new Error('Only account owners or administrators can delete accounts')
    }

    // Check if account is a personal account (these cannot be deleted)
    const account = await this.getAccountById(accountId)
    if (account?.type === 'personal') {
      throw new Error('Personal accounts cannot be deleted')
    }

    this.logInfo('Deleting account', { accountId })
    
    const supabase = await getServerClient()
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      this.logError('Failed to delete account', error, { accountId })
      throw new Error(`Failed to delete account: ${error.message}`)
    }

    this.logInfo('Account deleted successfully', { accountId })
  }

  // Helper methods
  async hasAccountAccess(userId: string, accountId: string): Promise<boolean> {
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .single()

    return !error && !!data
  }

  async isAccountOwner(userId: string, accountId: string): Promise<boolean> {
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .single()

    return !error && data?.role === 'owner'
  }

  async isAccountOwnerOrAdmin(userId: string, accountId: string): Promise<boolean> {
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .single()

    return !error && (data?.role === 'owner' || data?.role === 'admin')
  }

  async getAccountOwnerCount(accountId: string): Promise<number> {
    const supabase = await getServerClient()
    
    const { count, error } = await supabase
      .from('user_accounts')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('role', 'owner')

    return error ? 0 : (count || 0)
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    const supabase = await getServerClient()
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (error) {
      this.logError('Failed to fetch account by ID', error, { accountId })
      return null
    }

    return data
  }
}

export const accountService = new AccountService()
