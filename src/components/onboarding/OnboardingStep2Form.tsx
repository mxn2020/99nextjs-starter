"use client";

import { useFormStatus } from 'react-dom';
import { saveOnboardingStep2, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Example component
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Example component
import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type OnboardingStep2State = {
  message: string | undefined;
  errors?: {
    notifications_enabled?: string[];
    contact_method?: string[];
  } | null;
  success: boolean;
};

const initialState: OnboardingStep2State = {
  message: '',
  errors: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? 'Saving...' : 'Save and Continue'}
    </Button>
  );
}

interface OnboardingStep2FormProps {
  userId: string;
  // Pass current preferences if they exist to pre-fill the form
  // currentPreferences?: Partial<Database['public']['Tables']['user_preferences']['Row']>; // Example type
}

export default function OnboardingStep2Form({ userId }: OnboardingStep2FormProps) {
  const [state, formAction, isPending] = useActionState<OnboardingStep2State, FormData>(
    saveOnboardingStep2,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.success && !state.errors) {
      toast.error(state.message);
    }
    // Redirect is handled by server action on success
  }, [state]);

  const handleSkip = async () => {
    toast.info("Skipping step...");
    const result = await skipOnboardingStep(2); // Current step is 2
    if (result?.message && !result.success) {
      toast.error(result.message);
    }
  };

  // This component uses a direct form action, no separate handleSubmit needed unless complex FormData manipulation.

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {state.message && !state.success && !state.errors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="notifications_enabled" className="text-base">Enable Email Notifications</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Switch id="notifications_enabled" name="notifications_enabled" defaultChecked={true} />
          <span className="text-sm text-muted-foreground">Receive updates and news via email.</span>
        </div>
        {/* Example: Add Zod schema and error display if needed */}
      </div>

      <div>
        <Label className="text-base">Preferred Contact Method</Label>
        <RadioGroup defaultValue="email" name="contact_method" className="mt-2 space-y-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="r-email" />
            <Label htmlFor="r-email">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="inapp" id="r-inapp" />
            <Label htmlFor="r-inapp">In-app Notifications</Label>
          </div>
        </RadioGroup>
        {/* Example: Add Zod schema and error display if needed */}
      </div>

      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
          Skip for Now
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
