import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/server'
import { notesService } from '@/lib/services'

// GET /api/notes/[id] - Get a specific note
export const GET = withAuth(async (request: NextRequest, context, routeParams) => {
  const noteId = routeParams?.params?.id
  const note = await notesService.getNoteWithUser(noteId)
  
  if (!note) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Note not found'
      }
    }
  }

  return {
    success: true,
    data: note,
  }
})

// PUT /api/notes/[id] - Update a note
export const PUT = withAuth(async (request: NextRequest, context, routeParams) => {
  const noteId = routeParams?.params?.id
  
  // Parse the request body manually since we're not using schema validation
  const body = await request.json()
  
  const result = await notesService.updateNote(noteId, body)
  
  return {
    success: true,
    data: result,
  }
})

// DELETE /api/notes/[id] - Delete a note
export const DELETE = withAuth(async (request: NextRequest, context, routeParams) => {
  const noteId = routeParams?.params?.id
  await notesService.deleteNote(noteId)
  
  return {
    success: true,
    data: {
      message: 'Note deleted successfully'
    }
  }
})
