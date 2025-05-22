
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/database.types';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserActivity } from '@/lib/activityLog';
import { adminCreateUserSchema } from '@/lib/schemas';
import type { UserProfile } from '@/lib/types';

// Schema for updating user details by admin
const adminUserUpdateSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['user', 'admin']).optional(),
    display_name: z.string().min(2, 'Display name must be at least 2 characters.').max(50, 'Display name too long.').optional().or(z.literal('')),
    onboarding_completed: z.boolean().optional(),
});

// Helper to check if current user is admin and get their ID/email
async function verifyAdminRoleAndGetActor(supabaseClient: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser();
    if (!adminUser) {
        throw new Error('Admin not authenticated.');
    }
    const { data: adminProfile, error: profileError } = await supabaseClient.from('users').select('role, email').eq('id', adminUser.id).single();
    if (profileError || !adminProfile) {
        throw new Error('Admin profile not found or error fetching profile.');
    }
    if (adminProfile.role !== 'admin') {
        throw new Error('Unauthorized: User is not an admin.');
    }
    return { id: adminUser.id, email: adminProfile.email || adminUser.email }; // Return admin's ID and email
}


export async function createUserByAdmin(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore); // For admin verification
    const supabaseAdmin = createSupabaseAdminClient(); // For creating user

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false, errors: null };
    }

    const result = adminCreateUserSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { message: 'Invalid data for user creation.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const { email, password, role, display_name, onboarding_completed } = result.data;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: { role: role } // Can pass role here if trigger handles it, or update separately
    });

    if (createError) {
        console.error("Admin create user auth error:", createError);
        return { message: `Failed to create user: ${createError.message}`, success: false, errors: null };
    }

    if (newUser && newUser.user) {
        // The handle_new_user trigger should create a profile.
        // We might need to explicitly update role or other fields if trigger doesn't cover all.
        const profileDataToSet: Partial<UserProfile> = {
            role: role, // Ensure role is set
            onboarding_completed: onboarding_completed,
            updated_at: new Date().toISOString(),
        };
        if (display_name) profileDataToSet.display_name = display_name;

        const { error: profileUpdateError } = await supabaseAdmin
            .from('users')
            .update(profileDataToSet)
            .eq('id', newUser.user.id);

        if (profileUpdateError) {
            console.warn("Admin create user profile update warning:", profileUpdateError.message);
            // User auth record created, but profile update had issues. Log and inform.
             await logUserActivity({
                actor_id: adminActor.id,
                user_id: newUser.user.id,
                activity_type: 'ADMIN_USER_CREATE',
                description: `Admin ${adminActor.email} created user ${email}. Auth record created, profile update failed: ${profileUpdateError.message}`,
                details: { email, role, error: profileUpdateError.message },
                target_resource_id: newUser.user.id,
                target_resource_type: 'user'
            });
            return { message: `User auth record created, but profile update failed: ${profileUpdateError.message}. Please edit user to set profile details.`, success: true, errors: null }; // Still a success for creation
        }
        
        await logUserActivity({
            actor_id: adminActor.id,
            user_id: newUser.user.id,
            activity_type: 'ADMIN_USER_CREATE',
            description: `Admin ${adminActor.email} created new user ${email} with role ${role}.`,
            details: { email, role, display_name, onboarding_completed },
            target_resource_id: newUser.user.id,
            target_resource_type: 'user'
        });

        revalidatePath('/admin/users');
        redirect('/admin/users'); // Or to the new user's edit page
    }
    
    return { message: 'User created successfully by admin!', success: true, errors: null };
}


export async function updateUserByAdmin(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient();


    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false, errors: null };
    }

    const rawFormData = {
        userId: formData.get('userId'),
        role: formData.get('role') || undefined,
        display_name: formData.get('display_name'),
        onboarding_completed: formData.get('onboarding_completed') === 'true' ? true : (formData.get('onboarding_completed') === 'false' ? false : undefined),
    };

    Object.keys(rawFormData).forEach(key => {
        if ((rawFormData as any)[key] === null || ((rawFormData as any)[key] === '' && key !== 'display_name')) {
            (rawFormData as any)[key] = undefined;
        }
    });

    const result = adminUserUpdateSchema.safeParse(rawFormData);

    if (!result.success) {
        return { message: 'Invalid data for user update.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const { userId, ...updateDataFromForm } = result.data;
    
    const { data: existingUserData } = await supabaseAdmin.from('users').select('role, display_name, onboarding_completed').eq('id', userId).single();


    const changes: Record<string, { old: any, new: any }> = {};
    const dataToUpdate: Partial<UserProfile> = {};

    if (updateDataFromForm.role !== undefined && updateDataFromForm.role !== existingUserData?.role) {
        dataToUpdate.role = updateDataFromForm.role;
        changes.role = { old: existingUserData?.role, new: updateDataFromForm.role };
    }
    if (updateDataFromForm.display_name !== undefined && updateDataFromForm.display_name !== existingUserData?.display_name) {
        dataToUpdate.display_name = updateDataFromForm.display_name === '' ? null : updateDataFromForm.display_name;
        changes.display_name = { old: existingUserData?.display_name, new: dataToUpdate.display_name };
    }
    if (updateDataFromForm.onboarding_completed !== undefined && updateDataFromForm.onboarding_completed !== existingUserData?.onboarding_completed) {
        dataToUpdate.onboarding_completed = updateDataFromForm.onboarding_completed;
        changes.onboarding_completed = { old: existingUserData?.onboarding_completed, new: updateDataFromForm.onboarding_completed };
    }


    if (Object.keys(dataToUpdate).length === 0) {
        return { message: 'No changes provided.', success: true, errors: null };
    }
    
    dataToUpdate.updated_at = new Date().toISOString();

    const { error: dbError } = await supabaseAdmin
        .from('users')
        .update(dataToUpdate)
        .eq('id', userId);

    if (dbError) {
        console.error("Admin update user DB error:", dbError);
        return { message: `Database error: ${dbError.message}`, success: false, errors: null };
    }
    
    // If role was changed, update in auth.users.app_metadata too
    if (dataToUpdate.role) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: dataToUpdate.role }
        });
        if (authUpdateError) {
            console.warn("Admin update user auth metadata (role) error:", authUpdateError);
            // Non-critical, proceed with logging and revalidation
        }
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: userId,
        activity_type: 'ADMIN_USER_UPDATE',
        description: `Admin ${adminActor.email} updated user ${userId}.`,
        details: { changes },
        target_resource_id: userId,
        target_resource_type: 'user'
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    revalidatePath(`/admin/users/${userId}/activity`);


    return { message: 'User updated successfully by admin!', success: true, errors: null };
}

export async function deleteUserByAdmin(userId: string) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient();

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false };
    }
    
    // Fetch user email before deleting for logging purposes
    let userEmailToDelete = userId; // Fallback to ID if email fetch fails
    try {
        const {data: userToDeleteAuth} = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userToDeleteAuth && userToDeleteAuth.user?.email) {
            userEmailToDelete = userToDeleteAuth.user.email;
        }
    } catch (fetchErr) {
        console.warn("Could not fetch user email before deletion:", fetchErr);
    }


    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        console.error("Admin delete user auth error:", error);
        return { message: `Failed to delete user: ${error.message}`, success: false };
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: userId, // User ID being deleted
        activity_type: 'ADMIN_USER_DELETE',
        description: `Admin ${adminActor.email} deleted user ${userEmailToDelete}.`,
        details: { deleted_user_id: userId, deleted_user_email: userEmailToDelete },
        target_resource_id: userId,
        target_resource_type: 'user'
    });

    revalidatePath('/admin/users');
    return { message: 'User deleted successfully.', success: true };
}

export async function toggleUserSuspensionAction(userId: string, currentBanUntil: string | null | undefined) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = await createSupabaseAdminClient();

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false };
    }

    const isCurrentlyBanned = currentBanUntil && currentBanUntil !== 'none' && new Date(currentBanUntil) > new Date();
    const newBanDuration = isCurrentlyBanned ? 'none' : '876000h'; // 100 years for "indefinite" ban

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: newBanDuration,
    });

    if (error) {
        console.error("Toggle user suspension error:", error);
        return { message: `Failed to ${isCurrentlyBanned ? 'unsuspend' : 'suspend'} user: ${error.message}`, success: false };
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: userId,
        activity_type: isCurrentlyBanned ? 'ADMIN_USER_UNSUSPEND' : 'ADMIN_USER_SUSPEND',
        description: `Admin ${adminActor.email} ${isCurrentlyBanned ? 'unsuspended' : 'suspended'} user ${userId}.`,
        details: { target_user_id: userId, new_ban_duration: newBanDuration },
        target_resource_id: userId,
        target_resource_type: 'user'
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    revalidatePath(`/admin/users/${userId}/activity`);
    return { message: `User ${isCurrentlyBanned ? 'unsuspended' : 'suspended'} successfully.`, success: true };
}

export async function resendVerificationEmailAction(userId: string, email: string | undefined | null) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = await createSupabaseAdminClient();

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false };
    }

    if (!email) {
        return { message: 'User email is not available.', success: false };
    }
    
    // Note: Supabase recommends using `inviteUserByEmail` for resending confirmation.
    // `generateLink` with type 'magiclink' or 'signup' can also work.
    // Let's use `inviteUserByEmail` as it's more direct for this purpose if user is unconfirmed.
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
         redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    });


    if (error) {
        console.error("Resend verification email (invite) error:", error);
        return { message: `Failed to resend verification email: ${error.message}`, success: false };
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: userId,
        activity_type: 'ADMIN_USER_RESEND_VERIFICATION',
        description: `Admin ${adminActor.email} resent verification email to ${email} for user ${userId}.`,
        details: { target_user_id: userId, email: email },
        target_resource_id: userId,
        target_resource_type: 'user'
    });

    revalidatePath(`/admin/users/${userId}/edit`);
    revalidatePath(`/admin/users/${userId}/activity`);
    return { message: 'Verification email resent successfully.', success: true };
}

export async function manuallyVerifyUserAction(userId: string) {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = await createSupabaseAdminClient();

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
    });

    if (error) {
        console.error("Manual verification error:", error);
        return { message: `Failed to manually verify user: ${error.message}`, success: false };
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: userId,
        activity_type: 'ADMIN_USER_EMAIL_VERIFY_MANUAL',
        description: `Admin ${adminActor.email} manually verified email for user ${userId}.`,
        details: { target_user_id: userId },
        target_resource_id: userId,
        target_resource_type: 'user'
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    revalidatePath(`/admin/users/${userId}/activity`);
    return { message: 'User manually verified successfully.', success: true };
}


export async function getUserActivityLogsServer(
    targetUserId: string,
    currentPage: number = 1,
    itemsPerPage: number = 10
): Promise<{ logs: any[]; totalCount: number; error?: string }> {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore); // Or admin client
    
    try {
        await verifyAdminRoleAndGetActor(supabase); // Ensure admin access
    } catch (e: any) {
        return { logs: [], totalCount: 0, error: e.message };
    }

    const startIndex = (currentPage - 1) * itemsPerPage;

    const { data, error, count } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${targetUserId},actor_id.eq.${targetUserId}`) // Logs where user is either target or actor
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

    if (error) {
        console.error("Error fetching user activity logs:", error);
        return { logs: [], totalCount: 0, error: error.message };
    }
    return { logs: data || [], totalCount: count || 0 };
}

// TODO: Implement saveSystemSettingsAction if needed.
    