
"use client";

import { useFormStatus } from 'react-dom';
import { saveOnboardingStep2, skipOnboardingStep } from '@/server/onboarding.actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { UserCustomPreferences, UserProfile } from '@/lib/types'; // Assuming preferences are part of UserProfile or a sub-type

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
      {pending ? 'Saving...' : 'Save and Continue'}
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

  // Extract initial values from currentPreferences
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
    // Redirect is handled by server action on success
  }, [state]);

  const handleSkip = () => {
    startSkipTransition(async () => {
      toast.info("Skipping step...");
      const result = await skipOnboardingStep(2); // Current step is 2
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

      <div>
        <Label htmlFor="notifications_enabled_switch" className="text-base">Enable Email Notifications</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Switch 
            id="notifications_enabled_switch" 
            name="notifications_enabled" // This will submit 'on' or nothing
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
          {/* Hidden input to ensure 'false' is sent when unchecked, or handle on server */}
           <input type="hidden" name="notifications_enabled" value={notificationsEnabled ? "true" : "false"} />

          <span className="text-sm text-muted-foreground">Receive updates and news via email.</span>
        </div>
        {state.errors?.notifications_enabled && (
            <p className="text-sm text-destructive mt-1">{state.errors.notifications_enabled[0]}</p>
        )}
      </div>

      <div>
        <Label className="text-base">Preferred Contact Method</Label>
        <RadioGroup 
            name="contact_method" 
            value={contactMethod} 
            onValueChange={(value) => setContactMethod(value as 'email' | 'inapp' | 'none')} 
            className="mt-2 space-y-1"
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
         {state.errors?.contact_method && (
            <p className="text-sm text-destructive mt-1">{state.errors.contact_method[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="preferred_language" className="text-base">Preferred Language</Label>
        <Select name="preferred_language" value={preferredLanguage} onValueChange={setPreferredLanguage}>
          <SelectTrigger id="preferred_language" className="mt-2">
            <SelectValue placeholder="Select your language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español (Spanish)</SelectItem>
            <SelectItem value="fr">Français (French)</SelectItem>
            <SelectItem value="de">Deutsch (German)</SelectItem>
            {/* TODO: Add more languages as needed */}
          </SelectContent>
        </Select>
        {state.errors?.preferred_language && (
            <p className="text-sm text-destructive mt-1">{state.errors.preferred_language[0]}</p>
        )}
      </div>

      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={handleSkip} className="w-full sm:w-auto" disabled={isSkipping}>
          {isSkipping ? 'Skipping...' : 'Skip for Now'}
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
