import type { Database } from './supabase'

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Account = Database['public']['Tables']['accounts']['Row']
export type AccountInsert = Database['public']['Tables']['accounts']['Insert']
export type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export type UserAccount = Database['public']['Tables']['user_accounts']['Row']
export type UserAccountInsert = Database['public']['Tables']['user_accounts']['Insert']
export type UserAccountUpdate = Database['public']['Tables']['user_accounts']['Update']

export type AccountType = 'personal' | 'team' | 'family' | 'enterprise' //Database['public']['Enums']['account_type']
export type UserRole = 'user' | 'admin' | 'superadmin' //Database['public']['Enums']['user_role']
export type AccountRole = 'admin' | 'member' | 'guest' //Database['public']['Enums']['account_role']

// Extended types with relationships
export interface UserWithAccounts extends User {
  user_accounts: (UserAccount & {
    account: Account
  })[]
}

export interface AccountWithUsers extends Account {
  user_accounts: (UserAccount & {
    user: User
  })[]
}

export interface NoteWithUser extends Note {
  user: User
  account: Account
}

// Authentication types
export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface CreateNoteForm {
  title: string
  content?: string
  isPublic?: boolean
  tags?: string[]
}

export interface UpdateNoteForm extends Partial<CreateNoteForm> {
  id: string
}

export interface CreateAccountForm {
  name: string
  type: AccountType
}

export interface UpdateProfileForm {
  name?: string
  bio?: string
  website?: string
  location?: string
  avatarUrl?: string
}

// Filter and sort types
export interface NotesFilter {
  search?: string
  category?: string
  tags?: string[]
  isPublic?: boolean
  userId?: string
  accountId?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryOptions {
  page?: number
  limit?: number
  sort?: SortOptions
}
