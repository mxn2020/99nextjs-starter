"use client";

import { useFormStatus } from 'react-dom';
import { saveOnboardingStep1, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect, useState, useRef, useTransition } from 'react'; // Add useTransition
import { toast } from 'sonner';
import AvatarUpload from '@/components/onboarding/AvatarUpload'; // Create this component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type OnboardingStep1State = {
  message: string | undefined;
  errors?: {
    display_name?: string[];
    avatar_url?: string[];
  } | null;
  success: boolean;
};

const initialState: OnboardingStep1State = {
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

export default function OnboardingStep1Form({
  userId,
  currentDisplayName,
  currentAvatarUrl,
}: {
  userId: string;
  currentDisplayName: string;
  currentAvatarUrl: string | null;
}) {
  const [state, formAction, isActionPending] = useActionState<OnboardingStep1State, FormData>( // Renamed isPending to isActionPending for clarity
    saveOnboardingStep1,
    initialState
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition(); // Add useTransition

  useEffect(() => {
    if (state.message && !state.success && !state.errors) {
      toast.error(state.message);
    }
    // Redirect is handled by server action on success
  }, [state]);

  const handleSkip = async () => {
    // You might want a loading state for skip as well
    toast.info("Skipping step...");
    const result = await skipOnboardingStep(1); // Current step is 1
    if (result?.message && !result.success) {
      toast.error(result.message);
    }
    // Redirect is handled by skipOnboardingStep action
  };

  // Need to use a submit handler to append file to FormData if not using a library
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (avatarFile) {
      formData.set('avatar_url', avatarFile); // 'avatar_url' is the field name expected by the server action for the file
    } else if (currentAvatarUrl) {
      formData.set('current_avatar_url', currentAvatarUrl); // Send current URL if no new file
    }
    startTransition(() => { // Wrap formAction call in startTransition
      formAction(formData);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {state.message && !state.success && !state.errors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <AvatarUpload
        currentAvatarUrl={avatarPreview}
        onAvatarChange={(file, previewUrl) => {
          setAvatarFile(file);
          setAvatarPreview(previewUrl);
        }}
        userId={userId} // Potentially for naming convention, though server action handles actual naming
      />
      {/* Hidden input for current_avatar_url if needed, or managed by server action logic */}
      {currentAvatarUrl && !avatarFile && (
        <input type="hidden" name="current_avatar_url" value={currentAvatarUrl} />
      )}


      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={currentDisplayName}
          required
          aria-describedby="display_name-error"
        />
        {state.errors?.display_name && (
          <p id="display_name-error" className="text-sm text-destructive mt-1">
            {state.errors.display_name[0]}
          </p>
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
