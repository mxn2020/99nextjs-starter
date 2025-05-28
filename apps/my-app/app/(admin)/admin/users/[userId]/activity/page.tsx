
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import { Button } from '@99packages/ui/components/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUserActivityLogsServer } from '@/server/admin.actions';
import UserActivityTable from '@/components/admin/UserActivityTable';
import { ITEMS_PER_PAGE } from '@/lib/pagination';
import { getServerClient } from '@/lib/supabase/server'; // For fetching user display name

export const dynamic = 'force-dynamic';

export default async function UserActivityLogPage({
    params,
    searchParams,
}: {
    params: Promise<{ userId: string }>;
    searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
    const { userId } = await params;
    const currentPage = Number((await searchParams)?.page) || 1;
    const limit = Number((await searchParams)?.limit) || ITEMS_PER_PAGE;

    const { logs, totalCount, error } = await getUserActivityLogsServer(userId, currentPage, limit);
    
    let userDisplayName = userId;
    const supabase = await getServerClient();
    const {data: profile} = await supabase.from('users').select('display_name').eq('id', userId).single();
    if (profile?.display_name) userDisplayName = profile.display_name;


    return (
        <div className="space-y-4">
            <Button variant="outline" size="sm" asChild className="w-fit">
                <Link href={`/admin/users/${userId}/edit`}><ArrowLeft className="mr-2 h-4 w-4" />Back to User Edit</Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>User Activity Log</CardTitle>
                    <CardDescription>
                        Showing activity for user: <span className="font-semibold">{userDisplayName}</span> (ID: {userId})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive">Error fetching activity logs: {error}</p>}
                    {!error && (
                        <UserActivityTable
                            logs={logs}
                            totalLogs={totalCount}
                            currentPage={currentPage}
                            itemsPerPage={limit}
                            targetUserId={userId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
    