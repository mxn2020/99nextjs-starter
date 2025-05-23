
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { profileUpdateSchema, accountPreferencesSchema } from '@/lib/schemas';
import type { Database, Json } from '@/lib/database.types';
import type { UserCustomPreferences } from '@/lib/types';
import { logUserActivity } from '@/lib/activityLog';

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
  if (result.data.display_name || result.data.display_name === '') { // Allow clearing display name
    dataToUpdate.display_name = result.data.display_name || null;
  }

  const avatarFile = formData.get('avatar_file') as File | null;

  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}/avatar_${Date.now()}.${avatarFile.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { message: `Avatar upload failed: ${uploadError.message}`, success: false, errors: null };
    }
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
    dataToUpdate.avatar_url = publicUrlData.publicUrl;
  } else if (formData.get('clear_avatar') === 'true') {
    dataToUpdate.avatar_url = null;
     // TODO: Optionally delete the old avatar from storage
  }


  if (Object.keys(dataToUpdate).length === 0) {
    return { message: 'No changes submitted.', success: true, errors: null };
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

  await logUserActivity({
      actor_id: user.id,
      user_id: user.id,
      activity_type: 'USER_PROFILE_UPDATE',
      description: 'User updated their profile.',
      details: { updatedFields: Object.keys(dataToUpdate) },
      target_resource_id: user.id,
      target_resource_type: 'user_profile'
  });

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard', 'layout'); // For header if it displays avatar/name
  revalidatePath('/dashboard/settings'); // Also revalidate settings page if profile info is shown there

  return { message: 'Profile updated successfully!', success: true, errors: null };
}


export async function saveUserPreferencesAction(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'User not authenticated.', success: false, errors: null };
  }

  const result = accountPreferencesSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid preference data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const newPreferences = result.data;

  // Fetch existing preferences to merge
  const { data: existingProfileData, error: fetchError } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 0 rows (should not happen for logged-in user)
    console.error("Error fetching existing preferences:", fetchError);
    return { message: 'Could not load existing preferences.', success: false, errors: null };
  }

  const existingPreferences = (existingProfileData?.preferences as UserCustomPreferences) || {};
  
  const updatedPreferences: UserCustomPreferences = {
    ...existingPreferences,
    ...newPreferences,
  };

  // Filter out undefined values from newPreferences before merging, if any Zod optional fields were not provided
  for (const key in updatedPreferences) {
    if (updatedPreferences[key as keyof UserCustomPreferences] === undefined) {
      delete updatedPreferences[key as keyof UserCustomPreferences];
    }
  }
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ preferences: updatedPreferences as Json, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error("Save user preferences error:", updateError);
    return { message: `Failed to save preferences: ${updateError.message}`, success: false, errors: null };
  }

  await logUserActivity({
      actor_id: user.id,
      user_id: user.id,
      activity_type: 'USER_PROFILE_UPDATE', // Or a more specific type like 'USER_PREFERENCES_UPDATE' if you add it to ENUM
      description: 'User updated their account preferences.',
      details: { preferences: newPreferences }, // Log only the changes submitted
      target_resource_id: user.id,
      target_resource_type: 'user_preferences'
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout'); // Revalidate layout if preferences affect it

  return { message: 'Preferences saved successfully!', success: true, errors: null };
}
