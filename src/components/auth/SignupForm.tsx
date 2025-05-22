
"use client";

import { useFormStatus } from 'react-dom';
import { signupWithPassword } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

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
{pending ? 'Signing Up...' : 'Sign Up'}
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
// Successful signup (auto-login) redirect is handled by the server action
}, [state]);

if (state.success && state.requiresConfirmation) {
return (
<Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
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
<div>
<Label htmlFor="email">Email address</Label>
<Input
id="email"
name="email"
type="email"
autoComplete="email"
required
aria-describedby="email-error"
/>
{state.errors?.email && (
<p id="email-error" className="text-sm text-destructive mt-1">
{state.errors.email[0]}
</p>
)}
</div>

  <div>
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      name="password"
      type="password"
      autoComplete="new-password"
      required
      aria-describedby="password-error"
    />
    {state.errors?.password && (
      <p id="password-error" className="text-sm text-destructive mt-1">
        {state.errors.password[0]}
      </p>
    )}
  </div>
  
  <div>
    <Label htmlFor="confirmPassword">Confirm Password</Label>
    <Input
      id="confirmPassword"
      name="confirmPassword"
      type="password"
      autoComplete="new-password"
      required
      aria-describedby="confirmPassword-error"
    />
     {state.errors?.confirmPassword && (
      <p id="confirmPassword-error" className="text-sm text-destructive mt-1">
        {state.errors.confirmPassword[0]}
      </p>
    )}
  </div>
  
  {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

  <SubmitButton />
</form>
);
}
