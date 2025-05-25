
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormStatus } from 'react-dom';
import { changePasswordAction } from "@/server/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type FormState = {
message: string | null;
errors?: Partial<Record<keyof ChangePasswordFormData, string[]>> | null;
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
Updating Password...
</>
) : (
'Update Password'
)}
</Button>
);
}
export default function ChangePasswordForm() {
const [state, formAction, isPending] = useActionState<FormState, FormData>(
changePasswordAction,
initialFormState
);
const form = useForm<ChangePasswordFormData>({
resolver: zodResolver(changePasswordSchema),
defaultValues: {
newPassword: "",
confirmNewPassword: "",
},
});
const formRef = useRef<HTMLFormElement>(null);
useEffect(() => {
if (state.message) {
if (state.success) {
toast.success(state.message);
form.reset();
} else if (!state.errors) {
toast.error(state.message);
}
}
}, [state, form]);
useEffect(() => {
if (state.errors) {
Object.keys(state.errors).forEach((key) => {
const field = key as keyof ChangePasswordFormData;
const message = state.errors?.[field]?.[0];
if (message) {
form.setError(field, { type: "server", message });
}
});
}
}, [state.errors, form]);
return (
<form
ref={formRef}
action={formAction}
onSubmit={form.handleSubmit(() => {
form.clearErrors();
if (formRef.current) {
const formData = new FormData(formRef.current);
formAction(formData);
}
})}
className="space-y-4"
>
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
<AlertTitle>Success!</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
)}
  <div className="space-y-2">
    <Label htmlFor="newPassword">New Password</Label>
    <Input
      id="newPassword"
      type="password"
      {...form.register("newPassword")}
      aria-invalid={form.formState.errors.newPassword ? "true" : "false"}
      className={form.formState.errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={form.formState.errors.newPassword?.message} />
  </div>

  <div className="space-y-2">
    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
    <Input
      id="confirmNewPassword"
      type="password"
      {...form.register("confirmNewPassword")}
      aria-invalid={form.formState.errors.confirmNewPassword ? "true" : "false"}
      className={form.formState.errors.confirmNewPassword ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={form.formState.errors.confirmNewPassword?.message} />
  </div>
  
  <SubmitButton />
</form>
);
}
