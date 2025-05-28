
import { getServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import EditUserForm from '@/components/admin/EditUserForm';
import type { UserWithProfileAndAuth } from '@/lib/types';
import { Button } from '@99packages/ui/components/button';
import Link from 'next/link';
import { ArrowLeft, Activity } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase/server';

export default async function AdminEditUserPage({ params }: { params: Promise<{ userId: string }> }) {

    const supabase = await getServerClient();
    const supabaseAdmin = getAdminClient();
    const { userId } = await params;

    try {
        const { data: userToEditData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !userToEditData) {
            console.error("Error fetching user for admin edit:", userError);
            return (
                <Card>
                    <CardHeader>
                        <Button variant="outline" size="sm" asChild className="mb-4 w-fit">
                            <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to Users</Link>
                        </Button>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">Could not load user: {userError?.message || "User not found."}</p>
                    </CardContent>
                </Card>
            );
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (authError) {
            console.error(`Error fetching auth data for user ${userId}:`, authError);
            // Proceed with profile data, auth_user might be partially available or null
        }

        const normalizedUserToEdit: UserWithProfileAndAuth = {
            ...userToEditData,
            auth_user: authData?.user ? {
                id: authData.user.id,
                email: authData.user.email,
                email_confirmed_at: authData.user.email_confirmed_at,
                banned_until: (authData.user as any).banned_until || null,
                last_sign_in_at: authData.user.last_sign_in_at,
                created_at: authData.user.created_at,
                updated_at: authData.user.updated_at
            } : null
        };

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" asChild className="w-fit">
                        <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to Users List</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-fit">
                        <Link href={`/admin/users/${userId}/activity`}><Activity className="mr-2 h-4 w-4" />View Activity Log</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit User</CardTitle>
                        <CardDescription>
                            Modify user details for <span className="font-semibold">
                                {normalizedUserToEdit.display_name || normalizedUserToEdit.auth_user?.email || userId}
                            </span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EditUserForm userToEdit={normalizedUserToEdit} />
                    </CardContent>
                </Card>
            </div>
        );

    } catch (error) {
        console.error("Error in AdminEditUserPage:", error);
        return (
            <Card>
                <CardHeader>
                    <Button variant="outline" size="sm" asChild className="mb-4 w-fit">
                        <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to Users</Link>
                    </Button>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">Could not load user. Please try again later.</p>
                </CardContent>
            </Card>
        );
    }
}
    