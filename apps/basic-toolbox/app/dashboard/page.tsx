import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentNotes } from '@/components/dashboard/recent-notes'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your account.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats */}
      <DashboardStats />

      {/* Recent Notes */}
      <RecentNotes />
    </div>
  )
}
