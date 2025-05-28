'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logger } from '@99packages/logger'
import { notesService } from '@/lib/services'
import { createNoteFormSchema, updateNoteFormSchema } from '@/lib/schemas'
import type { CreateNoteForm, UpdateNoteForm } from '@/lib/types'

export async function createNote(data: CreateNoteForm, accountId?: string) {
  try {
    logger.info('Server action: createNote', { data, accountId })
    
    const validatedData = createNoteFormSchema.parse(data)
    
    const note = await notesService.createNote(validatedData, accountId)
    
    revalidatePath('/notes')
    revalidatePath('/dashboard')
    if (accountId) {
      revalidatePath(`/dashboard/accounts/${accountId}`)
    }
    
    return {
      success: true,
      data: note,
    }
  } catch (error) {
    logger.error('Failed to create note', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note',
    }
  }
}

export async function updateNote(noteId: string, data: Partial<UpdateNoteForm>) {
  try {
    logger.info('Server action: updateNote', { noteId, data })
    
    // Remove id from data if present
    const { id, ...updateData } = data
    const validatedData = createNoteFormSchema.partial().parse(updateData)
    
    const note = await notesService.updateNote(noteId, validatedData)
    
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: note,
    }
  } catch (error) {
    logger.error('Failed to update note', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note',
    }
  }
}

export async function deleteNote(noteId: string) {
  try {
    logger.info('Server action: deleteNote', { noteId })
    
    await notesService.deleteNote(noteId)
    
    revalidatePath('/notes')
    revalidatePath('/dashboard')
    redirect('/notes')
  } catch (error) {
    logger.error('Failed to delete note', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note',
    }
  }
}

export async function toggleNoteVisibility(noteId: string, isPublic: boolean) {
  try {
    logger.info('Server action: toggleNoteVisibility', { noteId, isPublic })
    
    const note = await notesService.updateNote(noteId, { isPublic })
    
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: note,
    }
  } catch (error) {
    logger.error('Failed to toggle note visibility', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note visibility',
    }
  }
}
