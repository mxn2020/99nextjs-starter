
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UsersTable from '@/components/admin/UsersTable';
import type { UserWithProfileAndAuth } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/pagination';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function AdminUserManagementPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string; limit?: string }>;
}) {
  const supabase = await createSupabaseServerClient(); // For getting profiles
  const supabaseAdmin = createSupabaseAdminClient(); // For listing auth users

  const { query = '', page = '1', limit = String(ITEMS_PER_PAGE) } = (await searchParams) || {};

  const currentPage = Number(page);
  const itemsPerPage = Number(limit);

  try {
    // Fetch paginated and searched auth.users list
    // Supabase admin listUsers page is 1-indexed
    const { data: authUsersResponse, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
      page: currentPage,
      perPage: itemsPerPage,
    });

    if (authListError) {
      console.error("Error fetching auth users:", authListError);
      throw authListError;
    }
    
    const authUsers = authUsersResponse.users || [];
    // The 'total' from listUsers is the total matching the query, not overall total if query is empty.
    // For an empty query, it's the total users in the system.
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
            // Continue with auth data only if profiles fail
        }

        usersWithAuth = authUsers.map(authUser => {
            const profile = profilesData?.find(p => p.id === authUser.id);
            return {
                // Spread profile data, ensuring all UserProfile fields are present even if some are null/undefined
                id: authUser.id, // Always from authUser as source of truth for ID
                display_name: profile?.display_name || null,
                email: authUser.email || 'no email',
                avatar_url: profile?.avatar_url || null,
                preferences: profile?.preferences || null,
                onboarding_completed: profile?.onboarding_completed || false,
                onboarding_step: profile?.onboarding_step || 1,
                role: profile?.role || 'user', // Default to 'user' if profile or role is missing
                created_at: profile?.created_at || authUser.created_at!, // Prefer profile created_at, fallback to auth
                updated_at: profile?.updated_at || authUser.updated_at!, // Prefer profile updated_at, fallback to auth
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


    if (!usersWithAuth && query && !authListError) { // No results for a specific query
         return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>User Management</CardTitle>
                        <Button asChild size="sm">
                            <Link href="/admin/users/create"><PlusCircle className="mr-2 h-4 w-4" /> Create User</Link>
                        </Button>
                    </div>
                    <CardDescription>View and manage all users in the system. Search for users by email or name.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable users={[]} totalUsers={0} currentPage={currentPage} itemsPerPage={itemsPerPage} query={query} />
                </CardContent>
            </Card>
        );
    }


    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <Button asChild size="sm">
                <Link href="/admin/users/create"><PlusCircle className="mr-2 h-4 w-4" /> Create User</Link>
            </Button>
          </div>
          <CardDescription>
            View and manage all users in the system. Search for users by email or name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={usersWithAuth} totalUsers={totalUsers} currentPage={currentPage} itemsPerPage={itemsPerPage} query={query} />
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
    