
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Using server client for user context
import { revalidatePath } from 'next/cache';
import { onboardingStep1Schema, onboardingStep2Schema, onboardingStep3Schema } from '@/lib/schemas'; // Define these
import type { Database } from '@/lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore); // Use standard client that respects RLS for user's own updates

    const { error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) {
        console.error("Update user profile error:", error);
        return { success: false, message: error.message };
    }
    return { success: true };
}

export async function saveOnboardingStep1(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false };

    const result = onboardingStep1Schema.safeParse({
        display_name: formData.get('display_name'),
        // avatar_url is handled separately if it's an upload
    });

    if (!result.success) {
        return { message: 'Invalid data.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const avatarFile = formData.get('avatar_url') as File | null;
    let avatarUrl = formData.get('current_avatar_url') as string || null; // Keep current if no new file

    if (avatarFile && avatarFile.size > 0) {
        const fileName = `${user.id}/${Date.now()}_${avatarFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
                cacheControl: '3600',
                upsert: true, // Overwrite if file with same name exists (e.g. user_id/avatar.png)
            });

        if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            return { message: `Avatar upload failed: ${uploadError.message}`, success: false };
        }
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        avatarUrl = publicUrlData.publicUrl;
    }

    const updateResult = await updateUserProfile(user.id, {
        display_name: result.data.display_name,
        avatar_url: avatarUrl, // This might be null if no new file and no existing
        onboarding_step: 2,
    });

    if (!updateResult.success) {
        return { message: updateResult.message, success: false };
    }

    revalidatePath('/onboarding/step1');
    revalidatePath('/onboarding/step2'); // For layout/stepper
    revalidatePath('/dashboard', 'layout'); // Revalidate dashboard layout for header potentially
    redirect('/onboarding/step2');
}

export async function saveOnboardingStep2(prevState: any, formData: FormData) {
    // Similar structure to Step 1: validate, save, update onboarding_step, redirect
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false };

    // const result = onboardingStep2Schema.safeParse(...);
    // if (!result.success) { ... }

    // Example: Save preferences
    // const preferences = { settingA: formData.get('settingA') };

    const updateResult = await updateUserProfile(user.id, {
        // ...parsed preferences data...
        onboarding_step: 3,
    });

    if (!updateResult.success) {
        return { message: updateResult.message, success: false };
    }

    revalidatePath('/onboarding/step2');
    revalidatePath('/onboarding/step3');
    redirect('/onboarding/step3');
}

export async function saveOnboardingStep3(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'User not authenticated.', success: false };

    // const result = onboardingStep3Schema.safeParse(...);
    // if (!result.success) { ... }

    const updateResult = await updateUserProfile(user.id, {
        // ...parsed customization data...
        onboarding_step: 4,
    });

    if (!updateResult.success) {
        return { message: updateResult.message, success: false };
    }

    revalidatePath('/onboarding/step3');
    revalidatePath('/onboarding/step4');
    redirect('/onboarding/step4');
}

export async function completeOnboarding() {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // This should not happen if called from an authenticated context
        redirect('/login?message=Authentication required.');
        return;
    }

    const updateResult = await updateUserProfile(user.id, {
        onboarding_completed: true,
        onboarding_step: 0, // Or some final step number like 99, or null if you prefer
    });

    if (!updateResult.success) {
        // Handle error, maybe redirect to step4 with an error message
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
    // Max steps assumed 4 for this example
    if (nextStep > 4) {
        // If skipping the last step, mark as complete or redirect to final confirmation
        await completeOnboarding(); // This will redirect to dashboard
        return { success: true, message: "Onboarding completed by skipping." };
    }

    const updateResult = await updateUserProfile(user.id, {
        onboarding_step: nextStep,
    });

    if (!updateResult.success) {
        return { message: updateResult.message || 'Failed to skip step.', success: false };
    }
    revalidatePath(`/onboarding/step${currentStep}`);
    revalidatePath(`/onboarding/step${nextStep}`);
    redirect(`/onboarding/step${nextStep}`);
}
