import { BaseService } from './base.service'
import { accountService } from './account.service'
import { getServerClient } from '@/lib/supabase'
import type {
  Note,
  NoteInsert,
  NoteUpdate,
  CreateNoteForm,
  UpdateNoteForm,
  NotesFilter,
  QueryOptions,
  PaginatedResponse,
  NoteWithUser
} from '@/lib/types'

export class NotesService extends BaseService {
  async createNote(noteData: CreateNoteForm, accountId?: string): Promise<Note> {
    const currentUser = await this.requireAuthenticatedUser()

    // Use the user's personal account if no account specified
    let targetAccountId = accountId
    if (!targetAccountId) {
      const userAccounts = await accountService.getUserAccounts(currentUser.id)
      const personalAccount = userAccounts.find(acc => acc.type === 'personal')
      if (!personalAccount) {
        throw new Error('No personal account found')
      }
      targetAccountId = personalAccount.id
    }

    // Verify user has access to the account
    const hasAccess = await accountService.hasAccountAccess(currentUser.id, targetAccountId)
    if (!hasAccess) {
      throw new Error('Access denied to this account')
    }

    this.logInfo('Creating note', { ...noteData, userId: currentUser.id, accountId: targetAccountId })

    const supabase = await getServerClient()

    const insertData: NoteInsert = {
      title: noteData.title,
      content: noteData.content || null,
      user_id: currentUser.id,
      account_id: targetAccountId,
      is_public: noteData.isPublic || false,
      tags: noteData.tags || null,
    }

    const { data, error } = await supabase
      .from('notes')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      this.logError('Failed to create note', error, insertData)
      throw new Error(`Failed to create note: ${error.message}`)
    }

    this.logInfo('Note created successfully', { noteId: data.id })
    return data
  }

  async updateNote(noteId: string, updates: Partial<UpdateNoteForm>): Promise<Note> {
    const currentUser = await this.requireAuthenticatedUser()

    // Verify note ownership or admin access
    const note = await this.getNoteById(noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    const isOwner = note.user_id === currentUser.id
    const hasAccountAccess = await accountService.hasAccountAccess(currentUser.id, note.account_id)
    const isAdmin = await this.isAdmin(currentUser.id)

    if (!isOwner && !hasAccountAccess && !isAdmin) {
      throw new Error('Access denied to this note')
    }

    this.logInfo('Updating note', { noteId, updates })

    const supabase = await getServerClient()

    const updateData: NoteUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
    if (updates.tags !== undefined) updateData.tags = updates.tags

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single()

    if (error) {
      this.logError('Failed to update note', error, { noteId, updates })
      throw new Error(`Failed to update note: ${error.message}`)
    }

    this.logInfo('Note updated successfully', { noteId })
    return data
  }

  async deleteNote(noteId: string): Promise<void> {
    const currentUser = await this.requireAuthenticatedUser()

    // Verify note ownership or admin access
    const note = await this.getNoteById(noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    const isOwner = note.user_id === currentUser.id
    const isAdmin = await this.isAdmin(currentUser.id)

    if (!isOwner && !isAdmin) {
      throw new Error('Access denied to this note')
    }

    this.logInfo('Deleting note', { noteId })

    const supabase = await getServerClient()

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      this.logError('Failed to delete note', error, { noteId })
      throw new Error(`Failed to delete note: ${error.message}`)
    }

    this.logInfo('Note deleted successfully', { noteId })
  }

  async getNoteById(noteId: string): Promise<Note | null> {
    const supabase = await getServerClient()

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) {
      this.logError('Failed to fetch note by ID', error, { noteId })
      return null
    }

    return data
  }

  async getNoteWithUser(noteId: string): Promise<NoteWithUser | null> {
    const currentUser = await this.getAuthenticatedUser()

    const supabase = await getServerClient()

    let query = supabase
      .from('notes')
      .select(`
        *,
        user:users (*),
        account:accounts (*)
      `)
      .eq('id', noteId)

    // If not authenticated, only show public notes
    if (!currentUser) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query.single()

    if (error) {
      this.logError('Failed to fetch note with user', error, { noteId })
      return null
    }

    // Check access permissions for private notes
    if (!data.is_public && currentUser) {
      const isOwner = data.user_id === currentUser.id
      const hasAccountAccess = await accountService.hasAccountAccess(currentUser.id, data.account_id)
      const isAdmin = await this.isAdmin(currentUser.id)

      if (!isOwner && !hasAccountAccess && !isAdmin) {
        return null
      }
    }

    return data as NoteWithUser
  }

  async getUserNotes(
    userId: string,
    filter: NotesFilter = {},
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<Note>> {
    const currentUser = await this.getAuthenticatedUser()

    // Users can only see their own notes unless they're admin
    if (currentUser?.id !== userId && !await this.isAdmin(currentUser?.id)) {
      throw new Error('Access denied')
    }

    this.logInfo('Fetching user notes', { userId, filter, options })

    const supabase = await getServerClient()

    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
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
      this.logError('Failed to fetch user notes', error, { userId, filter, options })
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    this.logInfo('User notes fetched successfully', { userId, count: data.length, total: count })
    return this.buildPaginatedResponse(data, options, count || 0)
  }

  async getAccountNotes(
    accountId: string,
    filter: NotesFilter = {},
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<NoteWithUser>> {
    const currentUser = await this.requireAuthenticatedUser()

    // Verify user has access to the account
    const hasAccess = await accountService.hasAccountAccess(currentUser.id, accountId)
    if (!hasAccess && !await this.isAdmin(currentUser.id)) {
      throw new Error('Access denied to this account')
    }

    this.logInfo('Fetching account notes', { accountId, filter, options })

    const supabase = await getServerClient()

    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from('notes')
      .select(`
        *,
        user:users (*),
        account:accounts (*)
      `, { count: 'exact' })
      .eq('account_id', accountId)

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

    if (filter.userId) {
      query = query.eq('user_id', filter.userId)
    }

    // Apply sorting
    const sortField = options.sort?.field || 'created_at'
    const sortDirection = options.sort?.direction || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      this.logError('Failed to fetch account notes', error, { accountId, filter, options })
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    this.logInfo('Account notes fetched successfully', { accountId, count: data.length, total: count })
    return this.buildPaginatedResponse(data as NoteWithUser[], options, count || 0)
  }

  async getPublicNotes(
    filter: NotesFilter = {},
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<NoteWithUser>> {
    this.logInfo('Fetching public notes', { filter, options })

    const supabase = await getServerClient()

    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
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
      this.logError('Failed to fetch public notes', error, { filter, options })
      throw new Error(`Failed to fetch public notes: ${error.message}`)
    }

    this.logInfo('Public notes fetched successfully', { count: data.length, total: count })
    return this.buildPaginatedResponse(data as NoteWithUser[], options, count || 0)
  }

  async getNoteTags(accountId?: string): Promise<string[]> {
    this.logInfo('Fetching note tags', { accountId })

    const supabase = await getServerClient()

    let query = supabase
      .from('notes')
      .select('tags')
      .not('tags', 'is', null)

    if (accountId) {
      const currentUser = await this.requireAuthenticatedUser()
      const hasAccess = await accountService.hasAccountAccess(currentUser.id, accountId)
      if (!hasAccess && !await this.isAdmin(currentUser.id)) {
        throw new Error('Access denied to this account')
      }
      query = query.eq('account_id', accountId)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      this.logError('Failed to fetch note tags', error, { accountId })
      throw new Error(`Failed to fetch tags: ${error.message}`)
    }

    // Flatten and deduplicate tags
    const allTags = data.flatMap(note => note.tags || [])
    const uniqueTags = Array.from(new Set(allTags)).sort()

    this.logInfo('Note tags fetched successfully', { count: uniqueTags.length })
    return uniqueTags
  }

  async getRecentNotes(limit: number = 5): Promise<Note[]> {
    this.logInfo('Fetching recent notes', { limit })

    const supabase = await getServerClient()

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      this.logError('Failed to fetch recent notes', error, { limit })
      throw new Error(`Failed to fetch recent notes: ${error.message}`)
    }

    this.logInfo('Recent notes fetched successfully', { count: data.length })

    return data
  }

}

export const notesService = new NotesService()
