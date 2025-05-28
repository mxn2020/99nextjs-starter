'use client'

import { getBrowserClient } from '@/lib/supabase-client'
import type { 
  Note, 
  NoteInsert, 
  NoteUpdate, 
  CreateNoteForm,
  UpdateNoteForm,
  ApiResponse,
  NotesFilter,
  QueryOptions,
  PaginatedResponse,
  NoteWithUser 
} from '@/lib/types'

class NotesMutations {
  private supabase = getBrowserClient()

  async createNote(data: CreateNoteForm, accountId?: string): Promise<ApiResponse<Note>> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Authentication required',
        }
      }

      // Get user's personal account if no accountId provided
      let targetAccountId = accountId
      if (!targetAccountId) {
        const { data: userAccounts, error: accountError } = await this.supabase
          .from('user_accounts')
          .select('account:accounts(*)')
          .eq('user_id', user.id)

        if (accountError) {
          return {
            success: false,
            error: 'Failed to fetch user accounts',
          }
        }

        const personalAccount = userAccounts.find(ua => ua.account.type === 'personal')?.account
        if (!personalAccount) {
          return {
            success: false,
            error: 'No personal account found',
          }
        }

        targetAccountId = personalAccount.id
      }

      const insertData: NoteInsert = {
        title: data.title,
        content: data.content || null,
        user_id: user.id,
        account_id: targetAccountId,
        is_public: data.isPublic || false,
        tags: data.tags || null,
      }

      const { data: note, error } = await this.supabase
        .from('notes')
        .insert(insertData)
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
        data: note,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      }
    }
  }

  async updateNote(noteId: string, data: Partial<UpdateNoteForm>): Promise<ApiResponse<Note>> {
    try {
      const updateData: NoteUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (data.title !== undefined) updateData.title = data.title
      if (data.content !== undefined) updateData.content = data.content
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic
      if (data.tags !== undefined) updateData.tags = data.tags

      const { data: note, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
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
        data: note,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update note',
      }
    }
  }

  async deleteNote(noteId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

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
        error: error instanceof Error ? error.message : 'Failed to delete note',
      }
    }
  }

  async getUserNotes(
    userId: string,
    filter: NotesFilter = {},
    options: QueryOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<Note>>> {
    try {
      const page = options.page || 1
      const limit = options.limit || 10
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`)
      }

      if (filter.category) {
        query = query.eq('category', filter.category)
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags)
      }

      if (filter.isPublic !== undefined) {
        query = query.eq('is_public', filter.isPublic)
      }

      if (filter.accountId) {
        query = query.eq('account_id', filter.accountId)
      }

      // Apply sorting
      const sortField = options.sort?.field || 'created_at'
      const sortDirection = options.sort?.direction || 'desc'
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          success: true,
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
      }
    }
  }

  async getPublicNotes(
    filter: NotesFilter = {},
    options: QueryOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<NoteWithUser>>> {
    try {
      const page = options.page || 1
      const limit = options.limit || 10
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('notes')
        .select(`
          *,
          user:users (*),
          account:accounts (*)
        `, { count: 'exact' })
        .eq('is_public', true)

      // Apply filters
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`)
      }

      if (filter.category) {
        query = query.eq('category', filter.category)
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags)
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId)
      }

      if (filter.accountId) {
        query = query.eq('account_id', filter.accountId)
      }

      // Apply sorting
      const sortField = options.sort?.field || 'created_at'
      const sortDirection = options.sort?.direction || 'desc'
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          success: true,
          data: data as NoteWithUser[],
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch public notes',
      }
    }
  }
}

export const notesMutations = new NotesMutations()
