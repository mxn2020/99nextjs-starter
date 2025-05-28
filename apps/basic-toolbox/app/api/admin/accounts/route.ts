import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/auth/server'
import { getServerClient } from '@/lib/supabase'

// GET /api/admin/accounts - Get all accounts (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {

  // Parse query parameters manually
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const type = url.searchParams.get('type') || undefined
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  // Validate type parameter if provided
  if (type && !['personal', 'team', 'family', 'enterprise'].includes(type)) {
    return Response.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid account type. Must be one of: personal, team, family, enterprise'
      }
    }, { status: 400 })
  }

  const supabase = await getServerClient()

  let queryBuilder = supabase
    .from('accounts')
    .select(`
      *,
      owner:users!accounts_owner_id_fkey(id, name, email),
      user_accounts(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply search filter if provided
  if (search) {
    queryBuilder = queryBuilder.ilike('name', `%${search}%`)
  }

  // Apply type filter if provided
  if (type) {
    queryBuilder = queryBuilder.eq('type', type as 'personal' | 'team' | 'family' | 'enterprise')
  }

  const { data: accounts, error, count } = await queryBuilder

  if (error) {
    return Response.json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch accounts'
      }
    }, { status: 500 })
  }

  return Response.json({
    success: true,
    data: accounts,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
})
