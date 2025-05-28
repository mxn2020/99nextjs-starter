
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { profileUpdateSchema, accountPreferencesSchema, deleteAccountConfirmationSchema } from '@/lib/schemas';
import type { Database, Json } from '@/lib/database.types';
import type { UserCustomPreferences, UserIdentity, UserProfile } from '@/lib/types';
import { logUserActivity } from '@/lib/activityLog';
import { redirect } from 'next/navigation';

type UserProfileUpdate = Partial<Database['public']['Tables']['users']['Row']>;

export async function updateUserProfileServerAction(prevState: any, formData: FormData) {
  const supabase = await getServerClient();

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

  const avatarFile = formData.get('avatar_file') as File | null; // From ProfileForm

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
  } else if (formData.get('clear_avatar') === 'true') { // This field needs to be added to ProfileForm if clear functionality is desired
    dataToUpdate.avatar_url = null;
    // TODO: Optionally delete the old avatar from storage if a new one is uploaded or cleared.
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
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout'); // For header if it displays avatar/name

  return { message: 'Profile updated successfully!', success: true, errors: null };
}


export async function saveUserPreferencesAction(prevState: any, formData: FormData) {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'User not authenticated.', success: false, errors: null };
  }

  const result = accountPreferencesSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid preference data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const newPreferences = result.data;

  const { data: existingProfileData, error: fetchError } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Error fetching existing preferences:", fetchError);
    return { message: 'Could not load existing preferences.', success: false, errors: null };
  }

  const existingPreferences = (existingProfileData?.preferences as UserCustomPreferences) || {};
  
  const updatedPreferences: UserCustomPreferences = {
    ...existingPreferences,
    ...newPreferences,
  };

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
      activity_type: 'USER_PROFILE_UPDATE', 
      description: 'User updated their account preferences.',
      details: { preferences: newPreferences }, 
      target_resource_id: user.id,
      target_resource_type: 'user_preferences'
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout'); 

  return { message: 'Preferences saved successfully!', success: true, errors: null };
}

export async function unlinkOAuthAccountAction(identity: UserIdentity) {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  // Ensure the identity belongs to the current user for security, though Supabase handles this.
  if (!user.identities?.find(id => id.id === identity.id && id.user_id === user.id)) {
      return { success: false, error: 'Identity does not belong to the current user or does not exist.' };
  }
  
  // Cannot unlink the last identity if no password is set
  if (user.identities && user.identities.length === 1 && user.app_metadata.provider !== 'email') {
    // Get user directly by ID for verification
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(user.id);
    
    if (getUserError || !userData || !userData.user) {
      return { success: false, error: "Could not verify user's primary authentication method." };
    }
    // This check is a bit complex as `passwordHash` is not directly exposed.
    // A simpler check is if there is any 'email' provider identity OR if the user has ever used password.
    // Supabase's `unlinkIdentity` will prevent unlinking the last factor if it would lock out the user.
    // We rely on Supabase's internal checks here.
  }


  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);

  if (unlinkError) {
    console.error('Unlink OAuth Error:', unlinkError);
    return { success: false, error: unlinkError.message };
  }

  await logUserActivity({
    actor_id: user.id,
    user_id: user.id,
    activity_type: 'USER_OAUTH_UNLINK',
    description: `User unlinked OAuth provider: ${identity.provider}.`,
    details: { provider: identity.provider, identity_id: identity.id },
    target_resource_id: user.id,
    target_resource_type: 'user_identity'
  });
  
  revalidatePath('/dashboard/settings');
  return { success: true, message: `${identity.provider} account unlinked.` };
}

export async function exportUserDataAction(): Promise<Response> {
    const supabase = await getServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'User not authenticated.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        const { data: activityLogs, error: logsError } = await supabase
            .from('user_activity_logs')
            .select('*')
            .or(`user_id.eq.${user.id},actor_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        const dataToExport = {
            profile: profileData,
            activity_logs: activityLogs,
            auth_details: { // Selectively include non-sensitive auth details
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                identities: user.identities?.map(id => ({ provider: id.provider, created_at: id.created_at, last_sign_in_at: id.last_sign_in_at })),
            }
        };
        
        await logUserActivity({
            actor_id: user.id,
            user_id: user.id,
            activity_type: 'USER_DATA_EXPORT_REQUEST',
            description: 'User requested data export.',
            target_resource_id: user.id,
            target_resource_type: 'user_data'
        });

        return new Response(JSON.stringify(dataToExport, null, 2), {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="user_data_${user.id}_${new Date().toISOString().split('T')[0]}.json"`,
                'Content-Type': 'application/json',
            },
        });

    } catch (error: any) {
        console.error('Export User Data Error:', error);
        return new Response(JSON.stringify({ error: `Failed to export data: ${error.message || 'Unknown error'}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function deleteSelfAccountAction(confirmationPhrase: string) {
    const supabase = await getServerClient();
    const supabaseAdmin = getAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }

    const result = deleteAccountConfirmationSchema.safeParse({ confirmationPhrase });
    if (!result.success) {
        return { success: false, error: result.error.flatten().fieldErrors.confirmationPhrase?.[0] || "Invalid confirmation phrase." };
    }
    
    // Log attempt before actual deletion
    await logUserActivity({
        actor_id: user.id,
        user_id: user.id,
        activity_type: 'USER_ACCOUNT_DELETE', // This is the attempt/initiation
        description: 'User initiated account deletion process.',
        details: { confirmation_phrase_provided: true },
        target_resource_id: user.id,
        target_resource_type: 'user_account'
    });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error('Delete Self Account Error (Admin):', deleteError);
         await logUserActivity({ // Log failure
            actor_id: user.id,
            user_id: user.id,
            activity_type: 'USER_ACCOUNT_DELETE',
            description: `Failed to delete user account: ${deleteError.message}`,
            details: { error: deleteError.message },
            target_resource_id: user.id,
            target_resource_type: 'user_account'
        });
        return { success: false, error: `Failed to delete account: ${deleteError.message}` };
    }

    // The public.users row should be deleted by ON DELETE CASCADE.
    // Log successful deletion (though user is now gone, this log is for audit)
    // Note: This log might not associate with user_id if it's fully wiped immediately
    // It's better to log with actor_id which would be the user themselves before deletion.
    // The activity log was already created above for initiation, this confirms deletion.

    await supabase.auth.signOut(); // Sign out the user

    revalidatePath('/');
    redirect('/login?message=Account deleted successfully.'); // Redirect after sign out

    // This return might not be reached if redirect happens.
    return { success: true, message: 'Account deleted successfully. You will be logged out.' };
}
