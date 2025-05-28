
import { Suspense } from 'react';
import { getAdminClient } from '@/lib/supabase/server';
import { getServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import UsersTable from '@/components/admin/UsersTable';
import type { UserWithProfileAndAuth } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/pagination';
import { Button } from '@99packages/ui/components/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import UserTableSkeleton from '@/components/common/UserTableSkeleton';
export const dynamic = 'force-dynamic';
async function UsersContent({ searchParams }: { searchParams?: { query?: string; page?: string; limit?: string } }) {
const supabase = await getServerClient();
const supabaseAdmin = getAdminClient();
const { query = '', page = '1', limit = String(ITEMS_PER_PAGE) } = searchParams || {};
const currentPage = Number(page);
const itemsPerPage = Number(limit);
try {
const { data: authUsersResponse, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
page: currentPage,
perPage: itemsPerPage,
});
if (authListError) {
  console.error("Error fetching auth users:", authListError);
  throw authListError;
}

const authUsers = authUsersResponse.users || [];
const totalUsers = authUsersResponse.total || 0;

let usersWithAuth: UserWithProfileAndAuth[] = [];

if (authUsers.length > 0) {
    const userIds = authUsers.map(u => u.id);
    const { data: profilesData, error: profilesError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

    if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
    }

    usersWithAuth = authUsers.map(authUser => {
        const profile = profilesData?.find(p => p.id === authUser.id);
        return {
            id: authUser.id,
            display_name: profile?.display_name || null,
            email: authUser.email || 'no email',
            avatar_url: profile?.avatar_url || null,
            preferences: profile?.preferences || null,
            onboarding_completed: profile?.onboarding_completed || false,
            onboarding_step: profile?.onboarding_step || 1,
            role: profile?.role || 'user',
            created_at: profile?.created_at || authUser.created_at!,
            updated_at: profile?.updated_at || authUser.updated_at!,
            auth_user: {
                id: authUser.id,
                email: authUser.email,
                email_confirmed_at: authUser.email_confirmed_at,
                banned_until: (authUser as any).banned_until || null,
                last_sign_in_at: authUser.last_sign_in_at,
                created_at: authUser.created_at,
                updated_at: authUser.updated_at,
            }
        };
    });
}

return (
  <Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system. Search for users by email or name.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/admin/users/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create User
            </Link>
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <UsersTable 
        users={usersWithAuth} 
        totalUsers={totalUsers} 
        currentPage={currentPage} 
        itemsPerPage={itemsPerPage} 
        query={query} 
      />
    </CardContent>
  </Card>
);
} catch (error) {
console.error("Error in AdminUserManagementPage:", error);
return (
<Card>
<CardHeader>
<CardTitle>Error</CardTitle>
</CardHeader>
<CardContent>
<p className="text-destructive">Could not load users. Please try again later.</p>
</CardContent>
</Card>
);
}
}
export default async function AdminUserManagementPage({
searchParams,
}: {
searchParams?: Promise<{ query?: string; page?: string; limit?: string }>;
}) {
const resolvedSearchParams = await searchParams;
return (
<Suspense fallback={<UserTableSkeleton />}>
<UsersContent searchParams={resolvedSearchParams} />
</Suspense>
);
}
