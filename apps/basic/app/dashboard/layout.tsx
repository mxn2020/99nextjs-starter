import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { UserAccountsProvider } from '@/components/dashboard/user-accounts-provider'
import { userService } from '@/lib/services'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <UserAccountsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardNav user={user} />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </UserAccountsProvider>
  )
}
