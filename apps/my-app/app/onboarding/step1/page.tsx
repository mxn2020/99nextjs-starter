
import { getCurrentUser } from '@/server/auth.actions';
import OnboardingStep1Form from '@/components/onboarding/OnboardingStep1Form';
import { redirect } from 'next/navigation';
import { CardDescription, CardTitle } from '@99packages/ui/components/card';

export default async function OnboardingStep1Page() {
const user = await getCurrentUser();

if (!user || !user.profile) {
redirect('/login');
}
if (user.profile.onboarding_completed) {
redirect('/dashboard');
}
// Optional: Redirect to current step if user.profile.onboarding_step is > 1 and tries to access step 1
// if (user.profile.onboarding_step > 1) {
//   redirect(/onboarding/step${user.profile.onboarding_step});
// }

return (
<div>
<CardTitle className="text-2xl mb-1">Profile Basics</CardTitle>
<CardDescription className="mb-6">Tell us a bit about yourself.</CardDescription>
<OnboardingStep1Form
userId={user.id}
currentDisplayName={user.profile.display_name || ''}
currentAvatarUrl={user.profile.avatar_url || null}
/>
</div>
);
}
