
import { getServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getCurrentUser } from '@/server/auth.actions';
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
        console.warn("DashboardLayout: No user or profile found, redirecting to login.");
        redirect('/login?message=Session invalid or profile missing.');
    }
    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar userRole={user.profile.role} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
