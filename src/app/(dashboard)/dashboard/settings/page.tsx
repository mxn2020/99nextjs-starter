
import { Suspense } from 'react';
import { getCurrentUser } from '@/server/auth.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import AccountPreferencesForm from '@/components/user/AccountPreferencesForm';
import type { UserCustomPreferences, UserIdentity } from '@/lib/types';
import ChangePasswordForm from '@/components/user/ChangePasswordForm';
import LinkedAccountsManager from '@/components/user/LinkedAccountsManager';
import ExportDataSection from '@/components/user/ExportDataSection';
import DeleteAccountSection from '@/components/user/DeleteAccountSection';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
function SettingsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
async function SettingsContent() {
  const user = await getCurrentUser();
  if (!user || !user.profile) {
    redirect('/login?message=User not found');
  }
  const userPreferences = user.profile.preferences as UserCustomPreferences || {};
  const userIdentities = user.identities as UserIdentity[] || [];
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
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
            <h3 className="text-lg font-medium">User ID</h3>
            <p className="text-sm text-muted-foreground font-mono break-all">{user.id}</p>
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
          <CardTitle>Appearance Settings</CardTitle>
          <CardDescription>Customize the application appearance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">Select your preferred theme:</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Change Password</h3>
            {user.app_metadata.provider === 'email' ? (
              <ChangePasswordForm />
            ) : (
              <p className="text-sm text-muted-foreground">
                You are signed in with an OAuth provider ({user.app_metadata.provider}).
                Password management is handled by your OAuth provider.
              </p>
            )}
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-3">Linked Accounts</h3>
            <LinkedAccountsManager identities={userIdentities} currentUserId={user.id} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your personal data within the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Export Your Data</h3>
            <ExportDataSection />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-destructive mb-3">Delete Account</h3>
            <DeleteAccountSection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
