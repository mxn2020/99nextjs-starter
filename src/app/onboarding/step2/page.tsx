
import { getCurrentUser } from '@/server/auth.actions';
import { redirect } from 'next/navigation';
import OnboardingStep2Form from '@/components/onboarding/OnboardingStep2Form';
import { CardDescription, CardTitle } from '@/components/ui/card';

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
     // If they are beyond step 2 but not completed, redirect them to their current step or dashboard
    if (user.profile.onboarding_step > 2 && user.profile.onboarding_step <= 4) {
       redirect(`/onboarding/step${user.profile.onboarding_step}`);
    } else if (user.profile.onboarding_step < 2) { // If before step 2, send to their current step
       redirect(`/onboarding/step${user.profile.onboarding_step || 1}`);
    }
    // If onboarding_step is somehow invalid (e.g. 0, or >4 but not completed), default to step1 or dashboard
     else if (!user.profile.onboarding_completed) {
        redirect('/onboarding/step1');
     }
  }


  return (
    <div>
      <CardTitle className="text-2xl mb-1">Personal Preferences</CardTitle>
      <CardDescription className="mb-6">Help us tailor your experience with these settings.</CardDescription>
      <OnboardingStep2Form 
        userId={user.id}
        // Pass current preferences if available from user.profile or a related table
        // currentPreferences={user.profile.preferences} 
      />
    </div>
  );
}
    