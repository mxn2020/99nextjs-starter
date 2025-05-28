
import { getCurrentUser } from '@/server/auth.actions';
import { redirect } from 'next/navigation';
import OnboardingStep3Form from '@/components/onboarding/OnboardingStep3Form';
import { CardDescription, CardTitle } from '@99packages/ui/components/card';
import type { UserCustomPreferences, UserProfile } from '@/lib/types';

export default async function OnboardingStep3Page() {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login');
  }
  if (user.profile.onboarding_completed) {
    redirect('/dashboard');
  }
  // Ensure user is on the correct step
  if (user.profile.onboarding_step !== 3) {
    if (user.profile.onboarding_step > 3 && user.profile.onboarding_step <= 4) {
        redirect(`/onboarding/step${user.profile.onboarding_step}`);
    } else if (user.profile.onboarding_step < 3) {
        redirect(`/onboarding/step${user.profile.onboarding_step || 1}`);
    }
     else if (!user.profile.onboarding_completed) { // Fallback
        redirect('/onboarding/step1');
     }
  }
  
  const currentPreferences = user.profile.preferences as UserCustomPreferences || {};

  return (
    <div>
      <CardTitle className="text-2xl mb-1">Account Customization</CardTitle>
      <CardDescription className="mb-6">Further personalize your account settings and experience.</CardDescription>
      <OnboardingStep3Form  
        userId={user.id}
        currentPreferences={currentPreferences}
      />
    </div>
  );
}
    