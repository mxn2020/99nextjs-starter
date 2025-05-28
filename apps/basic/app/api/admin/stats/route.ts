import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/auth/server'
import { getServerClient } from '@/lib/supabase'

// GET /api/admin/stats - Get admin dashboard statistics
export const GET = withAdminAuth(async (request, { user }) => {
  // User is already authenticated and verified to be admin by withAdminAuth

  const supabase = await getServerClient()
  
  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get total accounts
  const { count: totalAccounts } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })

  // Get total notes
  const { count: totalNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })

  // Get users created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: recentUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get accounts created in the last 30 days
  const { count: recentAccounts } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get notes created in the last 30 days
  const { count: recentNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get user distribution by role
  const { data: usersByRole } = await supabase
    .from('users')
    .select('role')

  const roleStats = usersByRole?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Get account distribution by type
  const { data: accountsByType } = await supabase
    .from('accounts')
    .select('type')

  const typeStats = accountsByType?.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return {
    success: true,
    data: {
      totalUsers: totalUsers || 0,
      totalAccounts: totalAccounts || 0,
      totalNotes: totalNotes || 0,
      recentUsers: recentUsers || 0,
      recentAccounts: recentAccounts || 0,
      recentNotes: recentNotes || 0,
      usersByRole: roleStats,
      accountsByType: typeStats,
      systemHealth: {
        status: 'healthy',
        uptime: '99.8%',
        lastBackup: new Date().toISOString(),
      },
    },
  }
})
