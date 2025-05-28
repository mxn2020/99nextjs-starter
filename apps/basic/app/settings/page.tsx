import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { userService } from '@/lib/services'
import { SettingsForm } from '@/components/settings/settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card'

export const metadata: Metadata = {
  title: 'Settings | Basic App',
  description: 'Application settings and preferences',
}

export default async function SettingsPage() {
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Configure your application preferences and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
