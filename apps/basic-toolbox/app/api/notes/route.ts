import { NextRequest } from 'next/server'
import { createApiHandler } from '@99packages/logger/handlers'
import { withAuth } from '@/lib/auth/server'
import { notesService } from '@/lib/services'

// GET /api/notes - Get public notes or user's notes
export const GET = createApiHandler({
  method: 'GET',
}, async (request) => {
  // Parse query parameters manually
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const category = url.searchParams.get('category') || undefined
  const tags = url.searchParams.get('tags')?.split(',') || undefined
  const isPublic = url.searchParams.get('isPublic') === 'true' ? true : undefined
  const userId = url.searchParams.get('userId') || undefined
  const accountId = url.searchParams.get('accountId') || undefined
  const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : undefined
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
  const sortField = url.searchParams.get('sortField') || undefined
  const sortDirection = url.searchParams.get('sortDirection') as 'asc' | 'desc' || undefined
  const sort = sortField && sortDirection ? { field: sortField, direction: sortDirection } : undefined

  const filter = { search, category, tags, isPublic, userId, accountId }
  const options = { page, limit, sort }

  const result = await notesService.getPublicNotes(filter, options)
  
  return {
    success: true,
    data: result
  }
})

// POST /api/notes - Create a new note
export const POST = withAuth(async (request: NextRequest, context) => {
  let body
  try {
    body = await request.json()
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    }
  }

  // Manual validation
  if (!body.title || typeof body.title !== 'string' || body.title.length === 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Title is required and must be a non-empty string'
      }
    }
  }

  if (body.content !== undefined && typeof body.content !== 'string') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Content must be a string'
      }
    }
  }

  if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'isPublic must be a boolean'
      }
    }
  }

  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Tags must be an array'
      }
    }
  }

  if (body.accountId !== undefined && typeof body.accountId !== 'string') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'AccountId must be a string'
      }
    }
  }

  const { accountId, ...noteData } = body
  
  try {
    const result = await notesService.createNote(noteData, accountId)
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create note'
      }
    }
  }
})
