import { logger } from '@99packages/logger'
import { notesService } from '@/lib/services'
import type { 
  Note, 
  NoteWithUser, 
  NotesFilter, 
  QueryOptions, 
  PaginatedResponse 
} from '@/lib/types'

export async function getNoteById(noteId: string): Promise<Note | null> {
  try {
    return await notesService.getNoteById(noteId)
  } catch (error) {
    logger.error('Failed to get note by ID', { error, noteId })
    return null
  }
}

export async function getNoteWithUser(noteId: string): Promise<NoteWithUser | null> {
  try {
    return await notesService.getNoteWithUser(noteId)
  } catch (error) {
    logger.error('Failed to get note with user', { error, noteId })
    return null
  }
}

export async function getUserNotes(
  userId: string,
  filter: NotesFilter = {},
  options: QueryOptions = {}
): Promise<PaginatedResponse<Note> | null> {
  try {
    return await notesService.getUserNotes(userId, filter, options)
  } catch (error) {
    logger.error('Failed to get user notes', { error, userId, filter, options })
    return null
  }
}

export async function getAccountNotes(
  accountId: string,
  filter: NotesFilter = {},
  options: QueryOptions = {}
): Promise<PaginatedResponse<NoteWithUser> | null> {
  try {
    return await notesService.getAccountNotes(accountId, filter, options)
  } catch (error) {
    logger.error('Failed to get account notes', { error, accountId, filter, options })
    return null
  }
}

export async function getPublicNotes(
  filter: NotesFilter = {},
  options: QueryOptions = {}
): Promise<PaginatedResponse<NoteWithUser> | null> {
  try {
    return await notesService.getPublicNotes(filter, options)
  } catch (error) {
    logger.error('Failed to get public notes', { error, filter, options })
    return null
  }
}

export async function getNoteTags(accountId?: string): Promise<string[]> {
  try {
    return await notesService.getNoteTags(accountId)
  } catch (error) {
    logger.error('Failed to get note tags', { error, accountId })
    return []
  }
}

export async function getRecentNotes(limit: number = 5): Promise<Note[]> {
  try {
    return await notesService.getRecentNotes(limit)
  } catch (error) {
    logger.error('Failed to get recent notes', { error, limit })
    return []
  }
}
