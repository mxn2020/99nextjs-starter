'use client'

import { useState, useEffect } from 'react'
import { AdminUserManagement } from './admin-user-management'
import { AdminAccountManagement } from './admin-account-management'
import { AdminSystemSettings } from './admin-system-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@99packages/ui/components/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { Users, Building, Settings, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  totalAccounts: number
  totalNotes: number
  recentUsers: number
  recentAccounts: number
  recentNotes: number
  usersByRole: Record<string, number>
  accountsByType: Record<string, number>
  systemHealth: {
    status: string
    uptime: string
    lastBackup: string
  }
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }
      
      setStats(result.data)
    } catch (error) {
      toast.error('Failed to fetch admin statistics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentUsers || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalAccounts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentAccounts || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalNotes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentNotes || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats?.systemHealth?.uptime || '99.8%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.systemHealth?.status || 'All systems operational'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                High-level metrics and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <h4 className="font-medium mb-2">User Statistics</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Admins: {stats?.usersByRole?.admin || 0}</p>
                    <p>• Regular Users: {stats?.usersByRole?.user || 0}</p>
                    <p>• New users this month: {stats?.recentUsers || 0}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <h4 className="font-medium mb-2">Account Distribution</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Personal: {stats?.accountsByType?.personal || 0}</p>
                    <p>• Team: {stats?.accountsByType?.team || 0}</p>
                    <p>• Family: {stats?.accountsByType?.family || 0}</p>
                    <p>• Enterprise: {stats?.accountsByType?.enterprise || 0}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <h4 className="font-medium mb-2">Recent Activity</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• {stats?.recentUsers || 0} new users registered this month</p>
                    <p>• {stats?.recentNotes || 0} notes created this month</p>
                    <p>• {stats?.recentAccounts || 0} accounts created this month</p>
                    <p>• System backup: {stats?.systemHealth?.lastBackup ? new Date(stats.systemHealth.lastBackup).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <AdminAccountManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AdminSystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
