import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/auth/server'
import { getServerClient } from '@/lib/supabase'

// GET /api/admin/users - Get all users (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {

  // Parse query parameters manually
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const supabase = await getServerClient()

  let queryBuilder = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply search filter if provided
  if (search) {
    queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, error, count } = await queryBuilder

  if (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch users'
      }
    }
  }

  return {
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
})
