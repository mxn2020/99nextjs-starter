
import { getCurrentUser } from '@/server/auth.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
const user = await getCurrentUser();

if (!user || !user.profile) {
// This should be caught by middleware or layout
return <p>Loading user data or redirecting...</p>;
}

return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle>Welcome, {user.profile.display_name || user.email}!</CardTitle>
<CardDescription>This is your dashboard. Here's a quick overview.</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
<p>Your role: <span className="font-semibold capitalize">{user.profile.role}</span></p>
<p>Onboarding status: {user.profile.onboarding_completed ? 'Completed' : 'Pending'}</p>

      <div className="mt-6 space-x-4">
        <Button asChild>
          <Link href="/dashboard/profile">Manage Profile</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">Account Settings</Link>
        </Button>
      </div>
    </CardContent>
  </Card>

  {/* Placeholder for more dashboard widgets */}
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No recent activity to display yet.</p>
        {/* TODO: Implement activity feed */}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
         <Link href="/dashboard/profile" className="text-primary hover:underline">Edit Profile</Link>
         <Link href="/dashboard/settings" className="text-primary hover:underline">Update Preferences</Link>
         {/* Add more links as needed */}
      </CardContent>
    </Card>
  </div>
</div>
);
}
