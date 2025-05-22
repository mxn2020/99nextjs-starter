
"use client";

import { useFormStatus } from 'react-dom';
import { loginWithPassword } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/schemas'; // Zod schema for client-side pre-validation (optional but good UX)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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
      {pending ? 'Signing In...' : 'Sign In'}
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
    // Success redirect is handled by the server action
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
          autoComplete="current-password"
          required
          aria-describedby="password-error"
        />
        {state.errors?.password && (
          <p id="password-error" className="text-sm text-destructive mt-1">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <SubmitButton />
    </form>
  );
}
