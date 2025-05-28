
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormStatus } from 'react-dom';
import { saveUserPreferencesAction } from "@/server/user.actions";
import { Button } from "@99packages/ui/components/button";
import { Label } from "@99packages/ui/components/label";
import { Switch } from "@99packages/ui/components/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@99packages/ui/components/select";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { accountPreferencesFormSchema, type AccountPreferencesFormData } from "@/lib/schemas";
import type { UserCustomPreferences } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@99packages/ui/components/card";
import { Alert, AlertDescription, AlertTitle } from "@99packages/ui/components/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
<Button type="submit" disabled={pending} className="w-full sm:w-auto">
{pending ? (
<>
<LoadingSpinner size="sm" className="mr-2" />
Saving Preferences...
</>
) : (
'Save Preferences'
)}
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
resolver: zodResolver(accountPreferencesFormSchema),
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
} else if (!state.errors) {
toast.error(state.message);
}
}
}, [state]);
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
const formData = new FormData(formRef.current);
startTransition(() => {
formAction(formData);
});
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <span className="text-sm text-muted-foreground">Receive important updates and news via email.</span>
          <div className="flex items-center space-x-2">
            <Switch
              id="notifications_enabled_switch"
              checked={form.watch("notifications_enabled")}
              onCheckedChange={(checked) => form.setValue("notifications_enabled", checked, { shouldValidate: true, shouldDirty: true })}
            />
            <input
              type="hidden"
              name="notifications_enabled"
              value={form.watch("notifications_enabled") ? "true" : "false"}
            />
          </div>
        </div>
        <FormFieldError message={form.formState.errors.notifications_enabled?.message || state.errors?.notifications_enabled?.[0]} />
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
          </SelectContent>
        </Select>
        <FormFieldError message={form.formState.errors.preferred_language?.message || state.errors?.preferred_language?.[0]} />
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
        <FormFieldError message={form.formState.errors.interface_density?.message || state.errors?.interface_density?.[0]} />
      </div>

    </CardContent>
    <CardFooter>
      <SubmitButton />
    </CardFooter>
  </form>
</Card>
);
}
