
"use client";
import { useFormStatus } from 'react-dom';
import {
updateUserByAdmin,
resendVerificationEmailAction,
manuallyVerifyUserAction,
toggleUserSuspensionAction
} from '@/server/admin.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { UserWithProfileAndAuth } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, MailWarning, ShieldCheck, UserCheck, UserX, Info, Activity } from "lucide-react";
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
DialogClose,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
type EditUserFormState = {
message: string | null;
errors?: {
display_name?: string[];
role?: string[];
onboarding_completed?: string[];
userId?: string[];
} | null;
success: boolean;
};
const initialFormState: EditUserFormState = {
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
Saving Changes...
</>
) : (
'Save Changes'
)}
</Button>
);
}
interface EditUserFormProps {
userToEdit: UserWithProfileAndAuth;
}
export default function EditUserForm({ userToEdit }: EditUserFormProps) {
const [formState, formAction, isFormActionPending] = useActionState<EditUserFormState, FormData>(updateUserByAdmin, initialFormState);
const [isProcessingAction, startActionTransition] = useTransition();
const [currentRole, setCurrentRole] = useState(userToEdit.role);
const [onboardingCompleted, setOnboardingCompleted] = useState(userToEdit.onboarding_completed);
const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
useEffect(() => {
if (formState.message) {
if (formState.success) {
toast.success(formState.message);
setActionFeedback({ type: 'success', message: formState.message });
} else {
toast.error(formState.message || "An error occurred with the form submission.");
if (!formState.errors) {
setActionFeedback({ type: 'error', message: formState.message || "Update failed." });
} else {
setActionFeedback(null);
}
}
}
}, [formState]);
useEffect(() => {
setCurrentRole(userToEdit.role);
setOnboardingCompleted(userToEdit.onboarding_completed);
}, [userToEdit.role, userToEdit.onboarding_completed]);
const handleAdminAction = async (action: () => Promise<{ message: string, success: boolean }>) => {
setActionFeedback(null);
startActionTransition(async () => {
const result = await action();
if (result.success) {
toast.success(result.message);
setActionFeedback({ type: 'success', message: result.message });
} else {
toast.error(result.message);
setActionFeedback({ type: 'error', message: result.message });
}
});
};
const isEmailConfirmed = !!userToEdit.auth_user?.email_confirmed_at;
const isBanned = userToEdit.auth_user?.banned_until && userToEdit.auth_user.banned_until !== 'none' && new Date(userToEdit.auth_user.banned_until) > new Date();
return (
<div className="space-y-6">
{actionFeedback && (
<Alert variant={actionFeedback.type === 'success' ? "default" : "destructive"} className={actionFeedback.type === 'success' ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400" : ""}>
{actionFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
<AlertTitle>{actionFeedback.type === 'success' ? "Success" : "Action Error"}</AlertTitle>
<AlertDescription>{actionFeedback.message}</AlertDescription>
</Alert>
)}
  <form action={formAction} className="space-y-6 border p-4 sm:p-6 rounded-lg">
    <h3 className="text-lg font-medium border-b pb-2">User Profile Details</h3>
    {formState.message && !formState.success && !formState.errors && !actionFeedback && (
         <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Update Error</AlertTitle>
         <AlertDescription>{formState.message}</AlertDescription>
       </Alert>
    )}

    <input type="hidden" name="userId" value={userToEdit.id} />

    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" value={userToEdit.auth_user?.email || 'N/A'} disabled className="bg-muted/50" />
      <div className="flex items-center mt-1 space-x-2">
        {isEmailConfirmed ? (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center"><ShieldCheck className="h-3 w-3 mr-1"/>Verified</span>
        ) : (
          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center"><MailWarning className="h-3 w-3 mr-1"/>Not Verified</span>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="display_name">Display Name</Label>
      <Input
        id="display_name"
        name="display_name"
        defaultValue={userToEdit.display_name || ''}
        aria-invalid={formState.errors?.display_name ? "true" : "false"}
        className={formState.errors?.display_name ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      <FormFieldError message={formState.errors?.display_name?.[0]} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="role">Role</Label>
      <Select name="role" value={currentRole} onValueChange={(value) => setCurrentRole(value as 'user' | 'admin')}>
        <SelectTrigger 
          id="role" 
          aria-invalid={formState.errors?.role ? "true" : "false"}
          className={formState.errors?.role ? "border-destructive focus-visible:ring-destructive" : ""}
        >
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <FormFieldError message={formState.errors?.role?.[0]} />
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <Label htmlFor="onboarding_completed">Onboarding Completed</Label>
      <Switch
        id="onboarding_completed"
        name="onboarding_completed"
        checked={onboardingCompleted}
        onCheckedChange={setOnboardingCompleted}
      />
      <input type="hidden" name="onboarding_completed" value={onboardingCompleted ? "true" : "false"} />
    </div>
    <FormFieldError message={formState.errors?.onboarding_completed?.[0]} />
    
    <div className="space-y-2 text-xs text-muted-foreground">
      <p>Profile ID: <span className="font-mono">{userToEdit.id}</span></p>
      <p>Joined: {new Date(userToEdit.created_at).toLocaleString()}</p>
      {userToEdit.auth_user?.last_sign_in_at && <p>Last Sign In: {new Date(userToEdit.auth_user.last_sign_in_at).toLocaleString()}</p>}
      <p>Profile Last Updated: {new Date(userToEdit.updated_at).toLocaleString()}</p>
    </div>

    <div className="flex justify-start items-center pt-4">
<SubmitButton />
</div>
</form>
  <div className="space-y-4 border p-4 sm:p-6 rounded-lg">
    <h3 className="text-lg font-medium border-b pb-2">Admin Actions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" asChild className="w-full">
            <Link href={`/admin/users/${userToEdit.id}/activity`}>
                <Activity className="mr-2 h-4 w-4" /> View User Activity Log
            </Link>
        </Button>

      {!isEmailConfirmed && (
        <Button 
          variant="outline" 
          onClick={() => handleAdminAction(() => resendVerificationEmailAction(userToEdit.id, userToEdit.auth_user?.email))}
          disabled={isProcessingAction}
          className="w-full"
        >
          {isProcessingAction ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Sending...
            </>
          ) : (
            <>
              <MailWarning className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>
      )}
      {!isEmailConfirmed && (
        <Button 
          variant="outline" 
          onClick={() => handleAdminAction(() => manuallyVerifyUserAction(userToEdit.id))}
          disabled={isProcessingAction}
          className="w-full"
        >
          {isProcessingAction ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Manually Verify Email
            </>
          )}
        </Button>
      )}
      {isEmailConfirmed && (
         <div className="p-2 text-sm text-muted-foreground flex items-center col-span-full sm:col-span-1">
           <Info className="h-4 w-4 mr-2 text-blue-500"/> Email is already verified.
         </div>
      )}
    </div>
    <div className="mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={isBanned ? "secondary" : "destructive"} disabled={isProcessingAction} className="w-full">
              {isProcessingAction ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isBanned ? 'Unsuspending...' : 'Suspending...'}
                </>
              ) : (
                <>
                  {isBanned ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                  {isBanned ? `Unsuspend User (Banned until: ${new Date(userToEdit.auth_user!.banned_until!).toLocaleDateString()})` : 'Suspend User'}
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm User Suspension Status Change</DialogTitle>
              <DialogDescription>
                {isBanned 
                  ? `Are you sure you want to unsuspend ${userToEdit.display_name || userToEdit.auth_user?.email}? They will regain full access.`
                  : `Are you sure you want to suspend ${userToEdit.display_name || userToEdit.auth_user?.email}? They will be unable to log in.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                  <Button variant="ghost" disabled={isProcessingAction}>Cancel</Button>
              </DialogClose>
              <Button 
                variant={isBanned ? "secondary" : "destructive"}
                onClick={() => handleAdminAction(() => toggleUserSuspensionAction(userToEdit.id, userToEdit.auth_user?.banned_until))}
                disabled={isProcessingAction}
              >
                {isProcessingAction ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  isBanned ? 'Confirm Unsuspend' : 'Confirm Suspend'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  </div>
</div>
);
}
