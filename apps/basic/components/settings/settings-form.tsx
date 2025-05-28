'use client'

import { useState } from 'react'
import { Label } from '@99packages/ui/components/label'
import { Switch } from '@99packages/ui/components/switch'
import { Button } from '@99packages/ui/components/button'
import { Separator } from '@99packages/ui/components/separator'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true,
    theme: 'system',
  })

  const handleSave = async () => {
    try {
      // TODO: Replace with actual API call to save user preferences
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications and updates
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications in your browser
            </p>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new features and updates
            </p>
          </div>
          <Switch
            checked={settings.marketingEmails}
            onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Weekly Digest</Label>
            <p className="text-sm text-muted-foreground">
              Receive a weekly summary of your activity
            </p>
          </div>
          <Switch
            checked={settings.weeklyDigest}
            onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Privacy & Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your privacy and security preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Account Email</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Your email address: {user.email}
          </p>
          <Button variant="outline" size="sm">
            Change Email
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Password</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Last changed: Never
          </p>
          <Button variant="outline" size="sm">
            Change Password
          </Button>
        </div>

        <div className="p-4 border rounded-lg border-destructive/20">
          <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data
          </p>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}
