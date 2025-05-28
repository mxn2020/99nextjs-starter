
import { getCurrentUser } from '@/server/auth.actions';
import { redirect } from 'next/navigation';
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'; // TODO: Create this component

export default async function OnboardingLayout({
children,
}: {
children: React.ReactNode;
}) {
const user = await getCurrentUser();

if (!user || !user.profile) {
redirect('/login?message=Please log in to continue onboarding.');
}

if (user.profile.onboarding_completed) {
redirect('/dashboard');
}

const currentStep = user.profile.onboarding_step || 1;

return (
<div className="flex flex-col items-center justify-start min-h-screen bg-muted/40 p-4 md:p-8 pt-16">
<div className="w-full max-w-2xl">
<h1 className="text-3xl font-bold text-center mb-2 text-foreground">Welcome! Let's get you set up.</h1>
<p className="text-center text-muted-foreground mb-8">Complete these steps to personalize your experience.</p>
<OnboardingStepper currentStep={currentStep} totalSteps={4} />
<div className="mt-8 bg-card p-6 sm:p-8 rounded-lg shadow-lg">
{children}
</div>
</div>
</div>
);
}
