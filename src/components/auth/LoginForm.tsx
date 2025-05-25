
"use client";
import { useFormStatus } from 'react-dom';
import { loginWithPassword } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type LoginState = {
message: string;
errors?: {
email?: string[];
password?: string[];
} | null;
success: boolean;
};
const initialState: LoginState = {
message: '',
errors: null,
success: false,
};
function SubmitButton() {
const { pending } = useFormStatus();
return (
<Button type="submit" className="w-full" disabled={pending}>
{pending ? (
<>
<LoadingSpinner size="sm" className="mr-2" />
Signing In...
</>
) : (
'Sign In'
)}
</Button>
);
}
export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
const [state, formAction, isPending] = useActionState<LoginState, FormData>(
loginWithPassword,
initialState
);
useEffect(() => {
if (state.message && !state.success && !state.errors) {
toast.error(state.message);
}
}, [state]);
return (
<form action={formAction} className="space-y-6">
{state.message && !state.success && !state.errors && (
<Alert variant="destructive">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Login Failed</AlertTitle>
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
      autoComplete="current-password"
      required
      aria-invalid={state.errors?.password ? "true" : "false"}
      className={state.errors?.password ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.password?.[0]} />
  </div>

  {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

  <SubmitButton />
</form>
);
}
