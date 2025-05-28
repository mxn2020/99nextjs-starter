
import { Suspense } from 'react';
import { getCurrentUser } from '@/server/auth.actions';
import ProfileForm from '@/components/user/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card';
import { redirect } from 'next/navigation';
import ProfileFormSkeleton from '@/components/common/ProfileFormSkeleton';
async function ProfileContent() {
const user = await getCurrentUser();
if (!user || !user.profile) {
redirect('/login?message=User not found');
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
export default function ProfilePage() {
return (
<Suspense fallback={<ProfileFormSkeleton />}>
<ProfileContent />
</Suspense>
);
}
