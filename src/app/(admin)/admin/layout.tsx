
import { getCurrentUser } from '@/server/auth.actions';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar'; // Re-use dashboard sidebar, it handles admin links
import Header from '@/components/layout/Header';   // Re-use dashboard header

export default async function AdminLayout({
children,
}: {
children: React.ReactNode;
}) {
const user = await getCurrentUser();

if (!user || !user.profile) {
redirect('/login?message=Authentication required.');
}

if (user.profile.role !== 'admin') {
redirect('/dashboard?error=unauthorized_admin'); // Or a specific unauthorized page
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
