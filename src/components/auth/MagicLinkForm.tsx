
"use client";

import { useFormStatus } from 'react-dom';
import { loginWithMagicLink } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type MagicLinkState = {
  message: string;
  errors?: {
    email?: string[];
  } | null;
  success: boolean;
};

const initialState: MagicLinkState = {
  message: '',
  errors: null,
  success: false,
};

function SubmitButton() {
const { pending } = useFormStatus();
return (
<Button type="submit" className="w-full" disabled={pending}>
{pending ? 'Sending Link...' : 'Send Magic Link'}
</Button>
);
}

export default function MagicLinkForm({ redirectTo }: { redirectTo?: string }) {
const [state, formAction, isPending] = useActionState<MagicLinkState, FormData>(
  loginWithMagicLink,
  initialState
);

useEffect(() => {
if (state.message) {
if (state.success) {
toast.success(state.message);
} else if (!state.errors) { // Show general error if not field specific
toast.error(state.message);
}
}
}, [state]);

if (state.success) {
return (
<Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
<CheckCircle2 className="h-4 w-4 text-green-500" />
<AlertTitle>Magic Link Sent!</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
);
}

return (
<form action={formAction} className="space-y-4">
{state.message && !state.success && !state.errors && (
<Alert variant="destructive">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Error</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
)}
<div>
<Label htmlFor="magic-email">Email address</Label>
<Input
id="magic-email"
name="email" // Name must be 'email' to match Zod schema and server action
type="email"
autoComplete="email"
required
aria-describedby="magic-email-error"
/>
{state.errors?.email && (
<p id="magic-email-error" className="text-sm text-destructive mt-1">
{state.errors.email[0]}
</p>
)}
</div>
{redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
<SubmitButton />
</form>
);
}
