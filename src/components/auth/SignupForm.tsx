
"use client";
import { useFormStatus } from 'react-dom';
import { signupWithPassword } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type SignupState = {
message: string;
errors?: {
email?: string[];
password?: string[];
confirmPassword?: string[];
} | null;
success: boolean;
requiresConfirmation?: boolean;
};
const initialState: SignupState = {
message: '',
errors: null,
success: false,
requiresConfirmation: false,
};
function SubmitButton() {
const { pending } = useFormStatus();
return (
<Button type="submit" className="w-full" disabled={pending}>
{pending ? (
<>
<LoadingSpinner size="sm" className="mr-2" />
Signing Up...
</>
) : (
'Sign Up'
)}
</Button>
);
}
export default function SignupForm({ redirectTo }: { redirectTo?: string }) {
const [state, formAction, isPending] = useActionState<SignupState, FormData>(
signupWithPassword,
initialState
);
useEffect(() => {
if (state.message) {
if (state.success && state.requiresConfirmation) {
toast.success(state.message);
} else if (!state.success && !state.errors) {
toast.error(state.message);
}
}
}, [state]);
if (state.success && state.requiresConfirmation) {
return (
<Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
<CheckCircle2 className="h-4 w-4 text-green-500" />
<AlertTitle>Check Your Email</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
);
}
return (
<form action={formAction} className="space-y-6">
{state.message && !state.success && !state.errors && (
<Alert variant="destructive">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Signup Failed</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
)}
<div className="space-y-2">
<Label htmlFor="email">Email address</Label>
<Input
id="email"
name="email"
type="email"
autoComplete="email"
required
aria-invalid={state.errors?.email ? "true" : "false"}
className={state.errors?.email ? "border-destructive focus-visible:ring-destructive" : ""}
/>
<FormFieldError message={state.errors?.email?.[0]} />
</div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      name="password"
      type="password"
      autoComplete="new-password"
      required
      aria-invalid={state.errors?.password ? "true" : "false"}
      className={state.errors?.password ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.password?.[0]} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="confirmPassword">Confirm Password</Label>
    <Input
      id="confirmPassword"
      name="confirmPassword"
      type="password"
      autoComplete="new-password"
      required
      aria-invalid={state.errors?.confirmPassword ? "true" : "false"}
      className={state.errors?.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.confirmPassword?.[0]} />
  </div>
{redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
  <SubmitButton />
</form>
);
}
    