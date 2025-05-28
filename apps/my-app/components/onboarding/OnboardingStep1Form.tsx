
"use client";
import { useFormStatus } from 'react-dom';
import { saveOnboardingStep1, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@99packages/ui/components/button';
import { Input } from '@99packages/ui/components/input';
import { Label } from '@99packages/ui/components/label';
import { useActionState, useEffect, useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import AvatarUpload from '@/components/onboarding/AvatarUpload';
import { Alert, AlertDescription, AlertTitle } from "@99packages/ui/components/alert";
import { AlertCircle } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
{pending ? (
<>
<LoadingSpinner size="sm" className="mr-2" />
Saving...
</>
) : (
'Save and Continue'
)}
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
const [state, formAction, isActionPending] = useActionState<OnboardingStep1State, FormData>(
saveOnboardingStep1,
initialState
);
const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const formRef = useRef<HTMLFormElement>(null);
const [isTransitionPending, startTransition] = useTransition();
useEffect(() => {
if (state.message && !state.success && !state.errors) {
toast.error(state.message);
}
}, [state]);
const handleSkip = async () => {
toast.info("Skipping step...");
const result = await skipOnboardingStep(1);
if (result?.message && !result.success) {
toast.error(result.message);
}
};
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault();
const formData = new FormData(event.currentTarget);
if (avatarFile) {
formData.set('avatar_url', avatarFile);
} else if (currentAvatarUrl) {
formData.set('current_avatar_url', currentAvatarUrl);
}
startTransition(() => {
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
    userId={userId}
  />
  {currentAvatarUrl && !avatarFile && (
    <input type="hidden" name="current_avatar_url" value={currentAvatarUrl} />
  )}

  <div className="space-y-2">
    <Label htmlFor="display_name">Display Name</Label>
    <Input
      id="display_name"
      name="display_name"
      type="text"
      defaultValue={currentDisplayName}
      required
      aria-invalid={state.errors?.display_name ? "true" : "false"}
      className={state.errors?.display_name ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.display_name?.[0]} />
  </div>

  <input type="hidden" name="userId" value={userId} />

  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
    <Button 
      type="button" 
      variant="outline" 
      onClick={handleSkip} 
      className="w-full sm:w-auto"
      disabled={isTransitionPending}
    >
      {isTransitionPending ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Skipping...
        </>
      ) : (
        'Skip for Now'
      )}
    </Button>
    <SubmitButton />
  </div>
</form>
);
}
