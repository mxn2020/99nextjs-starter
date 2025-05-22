
"use client";

import { useFormStatus } from 'react-dom';
import { updateUserProfileServerAction } from '@/server/user.actions'; // Create this server action
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import AvatarUpload from '@/components/onboarding/AvatarUpload'; // Re-use avatar upload
import type { UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ProfileFormState = {
  message: string | null;
  errors?: {
    display_name?: string[];
    avatar_url?: string[];
  } | null;
  success: boolean;
};

const initialState: ProfileFormState = {
  message: null,
  errors: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving Changes...' : 'Save Changes'}
    </Button>
  );
}

interface ProfileFormProps {
  userProfile: UserProfile;
  userId: string;
  userEmail: string;
}

export default function ProfileForm({ userProfile, userId, userEmail }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(updateUserProfileServerAction, initialState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else if (!state.errors) { // Only show general error toast if no field errors
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (avatarFile) {
      formData.set('avatar_file', avatarFile); // Use a different name to distinguish from URL string if needed
    } else if (userProfile.avatar_url) {
      // If no new file, the server action can choose to keep the existing avatar_url
      // We can pass the current URL for the server action to know it hasn't been cleared
      formData.set('current_avatar_url', userProfile.avatar_url);
    }
    formAction(formData);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {state.message && (
        <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "bg-green-50 border-green-300 text-green-700" : ""}>
          {state.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{state.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={userEmail} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
      </div>

      <AvatarUpload
        currentAvatarUrl={avatarPreview}
        onAvatarChange={(file, previewUrl) => {
          setAvatarFile(file);
          setAvatarPreview(previewUrl);
        }}
        userId={userId}
      />

      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={userProfile.display_name || ''}
          aria-describedby="display_name-error"
        />
        {state.errors?.display_name && (
          <p id="display_name-error" className="text-sm text-destructive mt-1">
            {state.errors.display_name[0]}
          </p>
        )}
      </div>

      <input type="hidden" name="userId" value={userId} /> {/* Or derive from session in action */}

      <SubmitButton />
    </form>
  );
}
