
import { getCurrentUser } from '@/server/auth.actions';
import ProfileForm from '@/components/user/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
const user = await getCurrentUser();

if (!user || !user.profile) {
redirect('/login?message=User not found'); // Should be handled by layout/middleware
}

return (
<div className="max-w-2xl mx-auto">
<Card>
<CardHeader>
<CardTitle>Manage Your Profile</CardTitle>
<CardDescription>Update your display name and avatar.</CardDescription>
</CardHeader>
<CardContent>
<ProfileForm userProfile={user.profile} userId={user.id} userEmail={user.email!} />
</CardContent>
</Card>
</div>
);
}
