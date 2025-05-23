
import { getCurrentUser } from '@/server/auth.actions';
import { redirect } from 'next/navigation';
import OnboardingStep2Form from '@/components/onboarding/OnboardingStep2Form';
import { CardDescription, CardTitle } from '@/components/ui/card';
import type { UserCustomPreferences, UserProfile } from '@/lib/types';

export default async function OnboardingStep2Page() {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login');
  }
  if (user.profile.onboarding_completed) {
    redirect('/dashboard');
  }
  // Ensure user is on the correct step or has not skipped past it
  if (user.profile.onboarding_step !== 2) {
    if (user.profile.onboarding_step > 2 && user.profile.onboarding_step <= 4) {
        redirect(`/onboarding/step${user.profile.onboarding_step}`);
    } else if (user.profile.onboarding_step < 2) {
        redirect(`/onboarding/step${user.profile.onboarding_step || 1}`);
    }
     else if (!user.profile.onboarding_completed) { // Fallback for inconsistent state
        redirect('/onboarding/step1');
     }
  }

  // Pass current preferences to the form
  const currentPreferences = user.profile.preferences as UserCustomPreferences || {};


  return (
    <div>
      <CardTitle className="text-2xl mb-1">Personal Preferences</CardTitle>
      <CardDescription className="mb-6">Help us tailor your experience with these settings.</CardDescription>
      <OnboardingStep2Form  
        userId={user.id}
        currentPreferences={currentPreferences}
      />
    </div>
  );
}
    