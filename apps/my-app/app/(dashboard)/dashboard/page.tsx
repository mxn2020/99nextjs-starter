
import { Suspense } from 'react';
import { getCurrentUser } from '@/server/auth.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import { Button } from '@99packages/ui/components/button';
import Link from 'next/link';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
async function DashboardContent() {
const user = await getCurrentUser();
if (!user || !user.profile) {
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
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/profile">Manage Profile</Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/settings">Account Settings</Link>
        </Button>
      </div>
    </CardContent>
  </Card>

  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No recent activity to display yet.</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
         <Link href="/dashboard/profile" className="text-primary hover:underline">Edit Profile</Link>
         <Link href="/dashboard/settings" className="text-primary hover:underline">Update Preferences</Link>
      </CardContent>
    </Card>
  </div>
</div>
);
}
export default function DashboardPage() {
return (
<Suspense fallback={<DashboardSkeleton />}>
<DashboardContent />
</Suspense>
);
}
