
import { getCurrentUser } from '@/server/auth.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import AccountPreferencesForm from '@/components/user/AccountPreferencesForm';
import type { UserCustomPreferences } from '@/lib/types';
import ChangePasswordForm from '@/components/user/ChangePasswordForm'; // Import the new form

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login?message=User not found');
  }
  
  const userPreferences = user.profile.preferences as UserCustomPreferences || {};

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Basic account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Email Address</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">User Role</h3>
            <p className="text-sm text-muted-foreground capitalize">{user.profile.role}</p>
          </div>
        </CardContent>
      </Card>

      <AccountPreferencesForm currentPreferences={userPreferences} />
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="text-lg font-medium mb-3">Change Password</h3>
            <ChangePasswordForm />
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Appearance Settings</CardTitle>
          <CardDescription>Customize the application appearance.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground">Select your preferred theme:</p>
            <ThemeToggle />
        </CardContent>
      </Card>
      
      {/* TODO: Add sections for managing linked OAuth accounts, exporting data, deleting account */}
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                (Actions like deleting account will be here.)
                  {/* TODO: Implement Delete Account functionality */}
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
