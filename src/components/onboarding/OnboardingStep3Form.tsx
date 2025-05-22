"use client";

import { useFormStatus } from 'react-dom';
import { saveOnboardingStep3, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; // Example component
import { Textarea } from '@/components/ui/textarea'; // Example component
import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type OnboardingStep3State = {
  message: string | undefined;
  errors?: {
    bio?: string[];
    feature_beta_access?: string[];
  } | null;
  success: boolean;
};

const initialState: OnboardingStep3State = {
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

interface OnboardingStep3FormProps {
  userId: string;
  // Pass current customizations if they exist
  // currentCustomizations?: any; 
}

export default function OnboardingStep3Form({ userId }: OnboardingStep3FormProps) {
  const [state, formAction, isPending] = useActionState<OnboardingStep3State, FormData>(
    saveOnboardingStep3,
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
    const result = await skipOnboardingStep(3); // Current step is 3
    if (result?.message && !result.success) {
      toast.error(result.message);
    }
  };
  
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
        <Label htmlFor="bio" className="text-base">Short Bio (Optional)</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          placeholder="Tell us a little about yourself..." 
          className="mt-2"
          rows={3} 
        />
        <p className="text-xs text-muted-foreground mt-1">This will be displayed on your public profile if you choose to have one.</p>
        {state.errors?.bio && (
          <p className="text-sm text-destructive mt-1">{state.errors.bio[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base">Feature Previews</Label>
        <div className="flex items-center space-x-2">
          <Checkbox id="feature_beta_access" name="feature_beta_access" />
          <Label htmlFor="feature_beta_access" className="font-normal text-sm">
            Opt-in to try new features before they are publicly released.
          </Label>
        </div>
        {state.errors?.feature_beta_access && (
          <p className="text-sm text-destructive mt-1">{state.errors.feature_beta_access[0]}</p>
        )}
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
    