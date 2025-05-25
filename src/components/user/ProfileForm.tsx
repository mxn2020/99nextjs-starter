
"use client";
import { useFormStatus } from 'react-dom';
import { updateUserProfileServerAction } from '@/server/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import AvatarUpload from '@/components/onboarding/AvatarUpload';
import type { UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { FormFieldError } from '@/components/common/FormFieldError';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
} else if (!state.errors) {
toast.error(state.message);
}
}
}, [state]);
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault();
const formData = new FormData(event.currentTarget);
if (avatarFile) {
formData.set('avatar_file', avatarFile);
} else if (userProfile.avatar_url) {
formData.set('current_avatar_url', userProfile.avatar_url);
}
formAction(formData);
};
return (
<form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
{state.message && (<Alert variant={state.success ? "default" : "destructive"} className={state.success ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400" : ""}>
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

  <div className="space-y-2">
    <Label htmlFor="display_name">Display Name</Label>
    <Input
      id="display_name"
      name="display_name"
      type="text"
      defaultValue={userProfile.display_name || ''}
      aria-invalid={state.errors?.display_name ? "true" : "false"}
      className={state.errors?.display_name ? "border-destructive focus-visible:ring-destructive" : ""}
    />
    <FormFieldError message={state.errors?.display_name?.[0]} />
  </div>

  <input type="hidden" name="userId" value={userId} />

  <SubmitButton />
</form>
);
}
