
"use client";
import { useFormStatus } from 'react-dom';
import { createUserByAdmin } from '@/server/admin.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type CreateUserFormState = {
message: string | null;
errors?: {
email?: string[];
password?: string[];
role?: string[];
display_name?: string[];
onboarding_completed?: string[];
} | null;
success: boolean;
};
const initialFormState: CreateUserFormState = {
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
Creating User...
</>
) : (
'Create User'
)}
</Button>
);
}
export default function CreateUserForm() {
const [state, formAction, isActionPending] = useActionState<CreateUserFormState, FormData>(createUserByAdmin, initialFormState);
const [role, setRole] = useState<'user' | 'admin'>('user');
const [onboardingCompleted, setOnboardingCompleted] = useState(false);
useEffect(() => {
if (state.message) {
if (state.success) {
toast.success(state.message);
} else {
toast.error(state.message || "An error occurred during user creation.");
}
}
}, [state]);
return (
<form action={formAction} className="space-y-6">
{state.message && !state.success && !state.errors && (
<Alert variant="destructive">
<AlertCircle className="h-4 w-4" />
<AlertTitle>Creation Error</AlertTitle>
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
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      name="email" 
      type="email" 
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
      required 
      aria-invalid={state.errors?.password ? "true" : "false"}
      className={state.errors?.password ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <p className="text-xs text-muted-foreground">Min 8 characters. User will be prompted to change it upon first login if desired.</p>
    <FormFieldError message={state.errors?.password?.[0]} />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="display_name">Display Name (Optional)</Label>
    <Input 
      id="display_name" 
      name="display_name" 
      type="text" 
      aria-invalid={state.errors?.display_name ? "true" : "false"}
      className={state.errors?.display_name ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.display_name?.[0]} />
  </div>

  <div className="space-y-2">
    <Label htmlFor="role">Role</Label>
    <Select name="role" value={role} onValueChange={(value) => setRole(value as "user" | "admin")}>
      <SelectTrigger 
        id="role" 
        aria-invalid={state.errors?.role ? "true" : "false"}
        className={state.errors?.role ? "border-destructive focus-visible:ring-destructive" : ""}
      >
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
    <FormFieldError message={state.errors?.role?.[0]} />
  </div>

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
    <div>
      <Label htmlFor="onboarding_completed">Mark Onboarding as Completed</Label>
      <p className="text-xs text-muted-foreground">Skip onboarding flow for this user</p>
    </div>
    <Switch
      id="onboarding_completed"
      name="onboarding_completed"
      checked={onboardingCompleted}
      onCheckedChange={setOnboardingCompleted}
      value={onboardingCompleted ? "true" : "false"}
    />
  </div>
  <FormFieldError message={state.errors?.onboarding_completed?.[0]} />

  <div className="pt-2">
    <SubmitButton />
  </div>
</form>
);
}
