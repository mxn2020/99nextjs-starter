
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { profileUpdateSchema } from '@/lib/schemas'; // Define this schema
import type { Database } from '@/lib/database.types';

type UserProfileUpdate = Partial<Database['public']['Tables']['users']['Row']>;

export async function updateUserProfileServerAction(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'User not authenticated.', success: false, errors: null };
  }

  const rawFormData = {
    display_name: formData.get('display_name'),
    // avatar_file is handled separately
  };

  const result = profileUpdateSchema.safeParse(rawFormData);

  if (!result.success) {
    return { message: 'Invalid data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const dataToUpdate: UserProfileUpdate = {};
  if (result.data.display_name) {
    dataToUpdate.display_name = result.data.display_name;
  }

  const avatarFile = formData.get('avatar_file') as File | null;
  let currentAvatarUrl = formData.get('current_avatar_url') as string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}/avatar_${Date.now()}.${avatarFile.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true, // true to overwrite if user uploads new avatar with same conventional name
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { message: `Avatar upload failed: ${uploadError.message}`, success: false, errors: null };
    }
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
    dataToUpdate.avatar_url = publicUrlData.publicUrl;
  } else if (formData.has('current_avatar_url') && !avatarFile) {
    // If current_avatar_url is explicitly passed and no new file, it means keep it (or it was cleared on client)
    // This logic depends on how you handle avatar clearing on the client.
    // If avatarPreview was set to null and submitted, current_avatar_url might not be sent or be empty.
    // A more robust way: if avatarFile is null and clearAvatar flag is true, set avatar_url to null.
    // For now, if no new file, we don't touch avatar_url unless explicitly told to clear it.
    // If you want to allow REMOVING avatar, you'd need a separate flag or check if currentAvatarUrl is empty string.
  }

  if (Object.keys(dataToUpdate).length === 0 && !avatarFile) {
    return { message: 'No changes submitted.', success: true, errors: null }; // Or false if you consider it an "inaction"
  }

  dataToUpdate.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('users')
    .update(dataToUpdate)
    .eq('id', user.id);

  if (updateError) {
    console.error("Update user profile error:", updateError);
    return { message: updateError.message, success: false, errors: null };
  }

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard', 'layout'); // For header if it displays avatar/name

  return { message: 'Profile updated successfully!', success: true, errors: null };
}
