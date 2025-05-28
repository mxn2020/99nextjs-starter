
"use client";
import { useFormStatus } from 'react-dom';
import { saveOnboardingStep2, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@99packages/ui/components/button';
import { Label } from '@99packages/ui/components/label';
import { Switch } from '@99packages/ui/components/switch';
import { RadioGroup, RadioGroupItem }from "@99packages/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@99packages/ui/components/select";
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@99packages/ui/components/alert";
import { AlertCircle } from "lucide-react";
import type { UserCustomPreferences } from '@/lib/types';
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type OnboardingStep2State = {
message?: string;
errors?: {
notifications_enabled?: string[];
contact_method?: string[];
preferred_language?: string[];
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
interface OnboardingStep2FormProps {
userId: string;
currentPreferences?: UserCustomPreferences;
}
export default function OnboardingStep2Form({ userId, currentPreferences }: OnboardingStep2FormProps) {
const [state, formAction] = useActionState<OnboardingStep2State, FormData>(
saveOnboardingStep2,
initialState
);
const formRef = useRef<HTMLFormElement>(null);
const [isSkipping, startSkipTransition] = useTransition();
const initialNotificationsEnabled = typeof currentPreferences?.notifications_enabled === 'boolean' ? currentPreferences.notifications_enabled : true;
const initialContactMethod = currentPreferences?.contact_method || 'email';
const initialPreferredLanguage = currentPreferences?.preferred_language || 'en';
const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
const [contactMethod, setContactMethod] = useState(initialContactMethod);
const [preferredLanguage, setPreferredLanguage] = useState(initialPreferredLanguage);
useEffect(() => {
if (state.message && !state.success && !state.errors) {
toast.error(state.message);
}
}, [state]);
const handleSkip = () => {
startSkipTransition(async () => {
toast.info("Skipping step...");
const result = await skipOnboardingStep(2);
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
  <div className="space-y-4">
    <Label htmlFor="notifications_enabled_switch" className="text-base">Enable Email Notifications</Label>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <span className="text-sm text-muted-foreground">Receive updates and news via email.</span>
      <div className="flex items-center space-x-2">
        <Switch 
          id="notifications_enabled_switch" 
          name="notifications_enabled"
          checked={notificationsEnabled}
          onCheckedChange={setNotificationsEnabled}
        />
        <input type="hidden" name="notifications_enabled" value={notificationsEnabled ? "true" : "false"} />
      </div>
    </div>
    <FormFieldError message={state.errors?.notifications_enabled?.[0]} />
  </div>

  <div className="space-y-4">
    <Label className="text-base">Preferred Contact Method</Label>
    <RadioGroup 
        name="contact_method" 
        value={contactMethod} 
        onValueChange={(value) => setContactMethod(value as 'email' | 'inapp' | 'none')} 
        className="space-y-2"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="email" id="r-email" />
        <Label htmlFor="r-email" className="font-normal">Email</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="inapp" id="r-inapp" />
        <Label htmlFor="r-inapp" className="font-normal">In-app Notifications</Label>
      </div>
       <div className="flex items-center space-x-2">
        <RadioGroupItem value="none" id="r-none" />
        <Label htmlFor="r-none" className="font-normal">None</Label>
      </div>
    </RadioGroup>
    <FormFieldError message={state.errors?.contact_method?.[0]} />
  </div>

  <div className="space-y-4">
    <Label htmlFor="preferred_language" className="text-base">Preferred Language</Label>
    <Select name="preferred_language" value={preferredLanguage} onValueChange={setPreferredLanguage}>
      <SelectTrigger 
        id="preferred_language" 
        className="max-w-xs"
        aria-invalid={state.errors?.preferred_language ? "true" : "false"}
      >
        <SelectValue placeholder="Select your language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español (Spanish)</SelectItem>
        <SelectItem value="fr">Français (French)</SelectItem>
        <SelectItem value="de">Deutsch (German)</SelectItem>
      </SelectContent>
    </Select>
    <FormFieldError message={state.errors?.preferred_language?.[0]} />
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
