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
import { adminCreateUserSchema } from '@/lib/schemas'; // For client-side validation if desired

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
      {pending ? 'Creating User...' : 'Create User'}
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
        // Redirect is handled by server action
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


      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required aria-describedby="email-error" />
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-destructive mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required aria-describedby="password-error" />
        {state.errors?.password && (
          <p id="password-error" className="text-sm text-destructive mt-1">{state.errors.password[0]}</p>
        )}
         <p className="text-xs text-muted-foreground mt-1">Min 8 characters. User will be prompted to change it upon first login if desired.</p>
      </div>
      
      <div>
        <Label htmlFor="display_name">Display Name (Optional)</Label>
        <Input id="display_name" name="display_name" type="text" aria-describedby="display_name-error" />
        {state.errors?.display_name && (
          <p id="display_name-error" className="text-sm text-destructive mt-1">{state.errors.display_name[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select name="role" value={role} onValueChange={(value) => setRole(value as "user" | "admin")}>
          <SelectTrigger id="role" aria-describedby="role-error">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {state.errors?.role && (
          <p id="role-error" className="text-sm text-destructive mt-1">{state.errors.role[0]}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="onboarding_completed"
          name="onboarding_completed"
          checked={onboardingCompleted}
          onCheckedChange={setOnboardingCompleted}
          value={onboardingCompleted ? "true" : "false"}
        />
        <Label htmlFor="onboarding_completed">Mark Onboarding as Completed</Label>
      </div>
       {state.errors?.onboarding_completed && (
          <p id="onboarding-error" className="text-sm text-destructive mt-1">{state.errors.onboarding_completed[0]}</p>
        )}


      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
