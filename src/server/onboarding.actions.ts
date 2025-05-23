
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { onboardingStep1Schema, onboardingStep2Schema, onboardingStep3Schema } from '@/lib/schemas';
import type { Database } from '@/lib/database.types';
import { UserCustomPreferences } from '@/lib/types';

type UserProfile = Database['public']['Tables']['users']['Row'];

async function updateUserProfileAndPreferences(userId: string, data: Partial<UserProfile>, preferences?: UserCustomPreferences) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const updatePayload: Partial<UserProfile> = { ...data, updated_at: new Date().toISOString() };

    if (preferences) {
        // Fetch existing preferences to merge, or start with new ones
        const { data: existingProfile, error: fetchError } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine if profile is new
            console.error("Error fetching existing preferences:", fetchError);
            return { success: false, message: "Could not fetch existing preferences: " + fetchError.message };
        }
        
        const existingPreferences = (existingProfile?.preferences as Record<string, any>) || {};
        updatePayload.preferences = { ...existingPreferences, ...preferences };
    }


    const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

    if (error) {
        console.error("Update user profile/preferences error:", error);
        return { success: false, message: error.message };
    }
    return { success: true };
}

export async function saveOnboardingStep1(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false, errors: null };

    const result = onboardingStep1Schema.safeParse({
        display_name: formData.get('display_name'),
    });

    if (!result.success) {
        return { message: 'Invalid data.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const avatarFile = formData.get('avatar_url') as File | null; // Name from form is avatar_url for the file
    let avatarUrlToSave = formData.get('current_avatar_url') as string || null;

    if (avatarFile && avatarFile.size > 0) {
        // TODO: Implement more advanced image processing here if needed (e.g., resizing, compression before upload)
        const fileName = `${user.id}/${Date.now()}_${avatarFile.name.replace(/\s+/g, '_')}`;
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
        avatarUrlToSave = publicUrlData.publicUrl;
    }

    const updateResult = await updateUserProfileAndPreferences(user.id, {
        display_name: result.data.display_name,
        avatar_url: avatarUrlToSave,
        onboarding_step: 2,
    });

    if (!updateResult.success) {
        return { message: updateResult.message, success: false, errors: null };
    }

    revalidatePath('/onboarding/step1');
    revalidatePath('/onboarding/step2');
    revalidatePath('/onboarding', 'layout');
    revalidatePath('/dashboard', 'layout');
    redirect('/onboarding/step2');
}

export async function saveOnboardingStep2(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false, errors: null };

    const result = onboardingStep2Schema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        console.error("Step 2 Zod errors:", result.error.flatten().fieldErrors);
        return { message: 'Invalid data for Step 2.', errors: result.error.flatten().fieldErrors, success: false };
    }
    
    const preferencesToSave = {
        notifications_enabled: result.data.notifications_enabled,
        contact_method: result.data.contact_method,
        preferred_language: result.data.preferred_language,
    };

    const updateResult = await updateUserProfileAndPreferences(user.id, 
        { onboarding_step: 3 },
        preferencesToSave
    );

    if (!updateResult.success) {
        return { message: updateResult.message, success: false, errors: null };
    }

    revalidatePath('/onboarding/step2');
    revalidatePath('/onboarding/step3');
    revalidatePath('/onboarding', 'layout');
    redirect('/onboarding/step3');
}

export async function saveOnboardingStep3(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false, errors: null };

    const result = onboardingStep3Schema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
         console.error("Step 3 Zod errors:", result.error.flatten().fieldErrors);
        return { message: 'Invalid data for Step 3.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const preferencesToSave = {
        bio: result.data.bio,
        feature_beta_access: result.data.feature_beta_access,
        privacy_level: result.data.privacy_level,
    };

    const updateResult = await updateUserProfileAndPreferences(user.id, 
        { onboarding_step: 4 },
        preferencesToSave
    );

    if (!updateResult.success) {
        return { message: updateResult.message, success: false, errors: null };
    }

    revalidatePath('/onboarding/step3');
    revalidatePath('/onboarding/step4');
    revalidatePath('/onboarding', 'layout');
    redirect('/onboarding/step4');
}

export async function completeOnboarding() {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?message=Authentication required.');
        return;
    }

    const updateResult = await updateUserProfileAndPreferences(user.id, {
        onboarding_completed: true,
        onboarding_step: 0, // Or a final step number like 99, or null
    });

    if (!updateResult.success) {
        redirect(`/onboarding/step4?error=${encodeURIComponent(updateResult.message || 'Failed to complete onboarding.')}`);
        return;
    }

    revalidatePath('/onboarding', 'layout');
    revalidatePath('/dashboard', 'layout');
    redirect('/dashboard?onboarding=completed');
}

export async function skipOnboardingStep(currentStep: number) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false };

    const nextStep = currentStep + 1;
    // Assuming ONBOARDING_STEPS has 4 steps (IDs 1, 2, 3, 4)
    // The last actual content step is 3. Step 4 is confirmation.
    // So if skipping from step 3, nextStep is 4 (confirmation)
    if (nextStep > 4) { 
        await completeOnboarding(); // This will redirect to dashboard
        return { success: true, message: "Onboarding completed by skipping." };
    }

    const updateResult = await updateUserProfileAndPreferences(user.id, {
        onboarding_step: nextStep,
    });

    if (!updateResult.success) {
        return { message: updateResult.message || 'Failed to skip step.', success: false };
    }
    revalidatePath(`/onboarding/step${currentStep}`);
    revalidatePath(`/onboarding/step${nextStep}`);
    revalidatePath('/onboarding', 'layout');
    redirect(`/onboarding/step${nextStep}`);
}
