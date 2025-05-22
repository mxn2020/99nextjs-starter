
import { getCurrentUser } from '@/server/auth.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';
// import AccountPreferencesForm from '@/components/user/AccountPreferencesForm'; // TODO: Implement this component
// import ChangePasswordForm from '@/components/user/ChangePasswordForm'; // TODO: Implement

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login?message=User not found');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences and settings.</CardDescription>
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
          
          {/* TODO: Placeholder for AccountPreferencesForm */}
          {/* <AccountPreferencesForm userPreferences={...} /> */}
          <div>
             <h3 className="text-lg font-medium">Account Preferences</h3>
             <p className="text-sm text-muted-foreground mt-1">
                (Section for preferences like notification settings, language, etc. - Form to be implemented)
            </p>
          </div>

          {/* TODO: Placeholder for ChangePasswordForm */}
           <div>
             <h3 className="text-lg font-medium">Change Password</h3>
             <p className="text-sm text-muted-foreground mt-1">
                (Section for changing password - Form to be implemented)
            </p>
          </div>


        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
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
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
    