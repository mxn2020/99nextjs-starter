import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { userService } from '@/lib/services'
import { hasRole } from '@/lib/utils/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Basic App',
  description: 'Administrative dashboard for managing users and system settings',
}

export default async function AdminPage() {
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  if (!hasRole(user, 'admin')) {
    redirect('/dashboard?error=insufficient_permissions')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, accounts, and system settings
        </p>
      </div>

      <AdminDashboard />
    </div>
  )
}
