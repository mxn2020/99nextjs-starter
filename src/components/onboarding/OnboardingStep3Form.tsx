
"use client";
import { useFormStatus } from 'react-dom';
import { saveOnboardingStep3, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { UserCustomPreferences } from '@/lib/types';
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type OnboardingStep3State = {
message?: string;
errors?: {
bio?: string[];
feature_beta_access?: string[];
privacy_level?: string[];
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
interface OnboardingStep3FormProps {
userId: string;
currentPreferences?: UserCustomPreferences;
}
export default function OnboardingStep3Form({ userId, currentPreferences }: OnboardingStep3FormProps) {
const [state, formAction] = useActionState<OnboardingStep3State, FormData>(
saveOnboardingStep3,
initialState
);
const formRef = useRef<HTMLFormElement>(null);
const [isSkipping, startSkipTransition] = useTransition();
const initialBio = currentPreferences?.bio || '';
const initialBetaAccess = typeof currentPreferences?.feature_beta_access === 'boolean' ? currentPreferences.feature_beta_access : false;
const initialPrivacyLevel = currentPreferences?.privacy_level || 'private';
const [betaAccess, setBetaAccess] = useState(initialBetaAccess);
const [privacyLevel, setPrivacyLevel] = useState(initialPrivacyLevel);
useEffect(() => {
if (state.message && !state.success && !state.errors) {
toast.error(state.message);
}
}, [state]);
const handleSkip = () => {
startSkipTransition(async () => {
toast.info("Skipping step...");
const result = await skipOnboardingStep(3);
if (result?.message && !result.success) {
toast.error(result.message);
}
});
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
  <div className="space-y-2">
    <Label htmlFor="bio" className="text-base">Short Bio (Optional)</Label>
    <Textarea  
      id="bio"  
      name="bio"  
      placeholder="Tell us a little about yourself..."  
      className="resize-none"
      rows={3}  
      defaultValue={initialBio}
      aria-invalid={state.errors?.bio ? "true" : "false"}
    />
    <p className="text-xs text-muted-foreground">Max 250 characters. This might be displayed on your public profile.</p>
    <FormFieldError message={state.errors?.bio?.[0]} />
  </div>

  <div className="space-y-4">
    <Label className="text-base">Feature Previews</Label>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <Label htmlFor="feature_beta_access" className="font-normal text-sm cursor-pointer">
        Opt-in to try new features before they are publicly released.
      </Label>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="feature_beta_access" 
          name="feature_beta_access" 
          checked={betaAccess}
          onCheckedChange={(checked) => setBetaAccess(checked as boolean)}
        />
        <input type="hidden" name="feature_beta_access" value={betaAccess ? "true" : "false"} />
      </div>
    </div>
    <FormFieldError message={state.errors?.feature_beta_access?.[0]} />
  </div>
  
  <div className="space-y-4">
    <Label className="text-base">Profile Privacy Level</Label>
    <RadioGroup 
        name="privacy_level" 
        value={privacyLevel} 
        onValueChange={(value) => setPrivacyLevel(value as 'public' | 'private' | 'friends_only')} 
        className="space-y-2"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="public" id="privacy-public" />
        <Label htmlFor="privacy-public" className="font-normal">Public</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="private" id="privacy-private" />
        <Label htmlFor="privacy-private" className="font-normal">Private</Label>
      </div>
       <div className="flex items-center space-x-2">
        <RadioGroupItem value="friends_only" id="privacy-friends" />
        <Label htmlFor="privacy-friends" className="font-normal">Friends Only (if applicable)</Label>
      </div>
    </RadioGroup>
    <FormFieldError message={state.errors?.privacy_level?.[0]} />
  </div>
  
  <input type="hidden" name="userId" value={userId} />

  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
    <Button 
      type="button" 
      variant="outline" 
      onClick={handleSkip} 
      className="w-full sm:w-auto" 
      disabled={isSkipping}
    >
      {isSkipping ? (
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
