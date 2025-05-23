
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormStatus } from 'react-dom';
import { saveUserPreferencesAction } from "@/server/user.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { accountPreferencesSchema } from "@/lib/schemas";
import type { UserCustomPreferences } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type AccountPreferencesFormData = z.infer<typeof accountPreferencesSchema>;

type FormState = {
  message: string | null;
  errors?: Partial<Record<keyof AccountPreferencesFormData, string[]>> | null;
  success: boolean;
};

const initialFormState: FormState = {
  message: null,
  errors: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving Preferences...' : 'Save Preferences'}
    </Button>
  );
}

interface AccountPreferencesFormProps {
  currentPreferences: UserCustomPreferences | null | undefined;
}

export default function AccountPreferencesForm({ currentPreferences }: AccountPreferencesFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveUserPreferencesAction,
    initialFormState
  );

  const form = useForm<AccountPreferencesFormData>({
    resolver: zodResolver(accountPreferencesSchema),
    defaultValues: {
      notifications_enabled: currentPreferences?.notifications_enabled ?? true,
      preferred_language: currentPreferences?.preferred_language ?? 'en',
      interface_density: currentPreferences?.interface_density ?? 'default',
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        // Optionally reset form to new defaults if needed, or let user see their saved values
        // form.reset(currentPreferences); // This would require fetching updated preferences
      } else if (!state.errors) {
        toast.error(state.message);
      }
    }
  }, [state]);

  // Update form default values if currentPreferences prop changes after initial render
  useEffect(() => {
    if (currentPreferences) {
      form.reset({
        notifications_enabled: currentPreferences.notifications_enabled ?? true,
        preferred_language: currentPreferences.preferred_language ?? 'en',
        interface_density: currentPreferences.interface_density ?? 'default',
      });
    }
  }, [currentPreferences, form.reset]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
        <CardDescription>Manage your notification settings, language, and interface appearance.</CardDescription>
      </CardHeader>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={form.handleSubmit(() => {
          if (formRef.current) {
            // Create FormData and submit if using useActionState with react-hook-form for client validation
            const formData = new FormData(formRef.current);
            formAction(formData);
          }
        })}
      >
        <CardContent className="space-y-6">
          {state.message && !state.success && !state.errors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state.message && state.success && (
            <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notifications_enabled_switch" className="text-base font-medium">Email Notifications</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications_enabled_switch"
                checked={form.watch("notifications_enabled")}
                onCheckedChange={(checked) => form.setValue("notifications_enabled", checked, { shouldValidate: true, shouldDirty: true })}
              />
              {/* Hidden input for form submission */}
              <input
                type="hidden"
                name="notifications_enabled"
                value={form.watch("notifications_enabled") ? "true" : "false"}
              />
              <span className="text-sm text-muted-foreground">Receive important updates and news via email.</span>
            </div>
            {form.formState.errors.notifications_enabled?.message && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.notifications_enabled.message}</p>
            )}
            {state.errors?.notifications_enabled && (
              <p className="text-sm text-destructive mt-1">{state.errors.notifications_enabled[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_language_select" className="text-base font-medium">Preferred Language</Label>
            <Select
              value={form.watch("preferred_language")}
              onValueChange={(value) => form.setValue("preferred_language", value, { shouldValidate: true, shouldDirty: true })}
              name="preferred_language"
            >
              <SelectTrigger id="preferred_language_select">
                <SelectValue placeholder="Select your language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                {/* TODO: Add more language options */}
              </SelectContent>
            </Select>
            {form.formState.errors.preferred_language?.message && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.preferred_language.message}</p>
            )}
            {state.errors?.preferred_language && (
              <p className="text-sm text-destructive mt-1">{state.errors.preferred_language[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interface_density_select" className="text-base font-medium">Interface Density</Label>
            <Select
              value={form.watch("interface_density")}
              onValueChange={(value: "compact" | "default" | "comfortable") => form.setValue("interface_density", value, { shouldValidate: true, shouldDirty: true })}
              name="interface_density"
            >
              <SelectTrigger id="interface_density_select">
                <SelectValue placeholder="Select interface density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.interface_density?.message && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.interface_density.message}</p>
            )}
            {state.errors?.interface_density && (
              <p className="text-sm text-destructive mt-1">{state.errors.interface_density[0]}</p>
            )}
          </div>

        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
