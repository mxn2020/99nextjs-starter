
import { getCurrentUser } from '@/server/auth.actions';
import { completeOnboarding } from '@/server/onboarding.actions';
import { redirect } from 'next/navigation';
import { Button } from '@99packages/ui/components/button';
import { CardDescription, CardHeader, CardTitle, Card, CardContent, CardFooter } from '@99packages/ui/components/card';
import { CheckCircle } from 'lucide-react';

export default async function OnboardingStep4Page({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
    const { error } = await searchParams || {};
    const user = await getCurrentUser();

    if (!user || !user.profile) {
        redirect('/login');
    }
    if (user.profile.onboarding_completed) {
        redirect('/dashboard');
    }
    if (user.profile.onboarding_step < 4 && !error) { // Allow if error occurred on this step
        redirect(`/onboarding/step${user.profile.onboarding_step || 1}`);
    }

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">You're All Set!</CardTitle>
                <CardDescription className="mt-2">
                    Your profile is personalized. Ready to explore?
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                {/* Optionally display a summary of choices if needed /}
<p className="text-muted-foreground">
Display Name: {user.profile.display_name || 'Not set'}
</p>
{/ Add other summary items if desired */}
                {error && (
                    <p className="mt-4 text-sm text-destructive">
                        Error: {decodeURIComponent(error)}
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex justify-center">
                <form action={completeOnboarding}>
                    <Button type="submit" size="lg">
                        Go to Dashboard
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
