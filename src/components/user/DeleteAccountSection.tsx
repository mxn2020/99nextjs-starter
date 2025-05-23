
"use client";

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteSelfAccountAction } from '@/server/user.actions';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteAccountConfirmationSchema } from '@/lib/schemas';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type DeleteAccountFormData = {
  confirmationPhrase: string;
};

export default function DeleteAccountSection() {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountConfirmationSchema),
    defaultValues: {
      confirmationPhrase: '',
    },
  });

  const requiredPhrase = "DELETE MY ACCOUNT";

  const handleDelete = async (data: DeleteAccountFormData) => {
    setActionError(null);
    if (data.confirmationPhrase !== requiredPhrase) {
        form.setError("confirmationPhrase", { type: "manual", message: `Please type "${requiredPhrase}" to confirm.`});
        return;
    }
    startTransition(async () => {
      const result = await deleteSelfAccountAction(data.confirmationPhrase);
      if (result.success) {
        toast.success(result.message || "Account deletion process initiated.");
        // Server action handles redirect, no need to close dialog here as page will change
        // setDialogOpen(false); // might cause issues if redirect is slower
      } else {
        const errorMessage = result.error || "Failed to delete account.";
        setActionError(errorMessage);
        toast.error(errorMessage);
        // Keep dialog open to show error within it or reset form.
        form.reset(); // Reset form so user can try again if it was a temporary issue
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground flex items-start">
        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-destructive" />
        <span>
          Permanently delete your account and all associated data. This action is irreversible. Please be certain before proceeding.
        </span>
      </p>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete My Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form onSubmit={form.handleSubmit(handleDelete)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account, including all your profile information, preferences, and activity logs.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {actionError && (
                <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Deletion Error</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="my-4 space-y-2">
              <Label htmlFor="confirmationPhrase">
                To confirm, please type "<span className="font-semibold text-destructive">{requiredPhrase}</span>" in the box below:
              </Label>
              <Input
                id="confirmationPhrase"
                {...form.register("confirmationPhrase")}
                autoComplete="off"
                aria-invalid={form.formState.errors.confirmationPhrase ? "true" : "false"}
              />
              {form.formState.errors.confirmationPhrase && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.confirmationPhrase.message}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => { form.reset(); setActionError(null); }} disabled={isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={isPending || !form.formState.isValid} className="bg-destructive hover:bg-destructive/90">
                {isPending ? 'Deleting Account...' : 'Yes, Delete My Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
