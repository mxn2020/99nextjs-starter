
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { createSupabaseAdminClient } from '@/lib/supabase/server'; // Use if specific admin tasks require service_role
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
// Fetch any admin-specific overview data here
// const supabase = await createSupabaseServerClient(); // Or adminClient if RLS bypass needed for some stats
// const { count: userCount, error: countError } = await supabase
//   .from('users')
//   .select('*', { count: 'exact', head: true });

// const { data: recentSignups, error: signupsError } = await supabase
//   .from('users')
//   .select('id, email, display_name, created_at')
//   .order('created_at', { ascending: false })
//   .limit(5);

return (
<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle>Admin Dashboard</CardTitle>
<CardDescription>Overview of system status and user activity.</CardDescription>
</CardHeader>
<CardContent>
<p>Welcome, Admin!</p>
{/* Placeholder for stats /}
{/ <p>Total Users: {userCount ?? 'N/A'}</p> */}
<p className="text-muted-foreground">Admin overview statistics and quick actions will be displayed here.</p>
</CardContent>
</Card>

  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View, edit, or manage user accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/users">Go to User Management</Link>
        </Button>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>System Analytics</CardTitle>
        <CardDescription>Registration/login metrics.</CardDescription>
      </CardHeader>
      <CardContent>
         {/* Placeholder for analytics */}
        <p className="text-muted-foreground">Analytics charts and data here.</p>
         <Button variant="outline" asChild className="mt-2">
          <Link href="/admin/analytics">View Analytics</Link>
        </Button>
      </CardContent>
    </Card>
     <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure application-wide settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <Link href="/admin/system">Configure Settings</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
   {/* <Card className="mt-6">
    <CardHeader><CardTitle>Recent Signups</CardTitle></CardHeader>
    <CardContent>
      {signupsError && <p className="text-destructive">Error loading recent signups.</p>}
      {recentSignups && recentSignups.length > 0 ? (
        <ul>
          {recentSignups.map(user => (
            <li key={user.id} className="text-sm border-b py-1">
              {user.display_name || user.email} - Joined: {new Date(user.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : <p>No recent signups.</p>}
    </CardContent>
  </Card> */}
</div>
);
}
