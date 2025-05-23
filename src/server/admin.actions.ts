"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, Json } from '@/lib/database.types';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserActivity } from '@/lib/activityLog';
import { adminCreateUserSchema, systemSettingsSchema } from '@/lib/schemas';
import type { UserCustomPreferences, UserProfile, SystemSettings, AdminAnalyticsData, DailySignup, UserRoleDistribution, EmailProviderSettings } from '@/lib/types';
import type { SystemSettingsFormData } from '@/lib/schemas';

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
        const profileUpdateData: { 
            role: typeof role;
            onboarding_completed: typeof onboarding_completed;
            updated_at: string;
            display_name?: string; 
        } = {
            role: role, 
            onboarding_completed: onboarding_completed,
            updated_at: new Date().toISOString(),
        };
        if (display_name) { 
            profileUpdateData.display_name = display_name; 
        }

        const { error: profileUpdateError } = await supabaseAdmin
            .from('users')
            .update(profileUpdateData) 
            .eq('id', newUser.user.id);

        if (profileUpdateError) {
            console.warn("Admin create user profile update warning:", profileUpdateError.message);
             await logUserActivity({
                actor_id: adminActor.id,
                user_id: newUser.user.id,
                activity_type: 'ADMIN_USER_CREATE',
                description: `Admin ${adminActor.email} created user ${email}. Auth record created, profile update failed: ${profileUpdateError.message}`,
                details: { email, role, error: profileUpdateError.message },
                target_resource_id: newUser.user.id,
                target_resource_type: 'user'
            });
            return { message: `User auth record created, but profile update failed: ${profileUpdateError.message}. Please edit user to set profile details.`, success: true, errors: null };
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
        redirect('/admin/users'); 
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
    const dataToUpdate: { 
        role?: 'user' | 'admin';
        display_name?: string | null;
        onboarding_completed?: boolean;
        updated_at?: string;
    } = {};

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
    
    if (dataToUpdate.role) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: dataToUpdate.role }
        });
        if (authUpdateError) {
            console.warn("Admin update user auth metadata (role) error:", authUpdateError);
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
    
    let userEmailToDelete = userId; 
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
        user_id: userId, 
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
    const newBanDuration = isCurrentlyBanned ? 'none' : '876000h'; 

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
    const supabase = await createSupabaseServerClient(cookieStore); 
    
    try {
        await verifyAdminRoleAndGetActor(supabase); 
    } catch (e: any) {
        return { logs: [], totalCount: 0, error: e.message };
    }

    const startIndex = (currentPage - 1) * itemsPerPage;

    const { data, error, count } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${targetUserId},actor_id.eq.${targetUserId}`) 
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

    if (error) {
        console.error("Error fetching user activity logs:", error);
        return { logs: [], totalCount: 0, error: error.message };
    }
    return { logs: data || [], totalCount: count || 0 };
}


export async function getSystemSettings(): Promise<{ settings: SystemSettings | null; error?: string }> {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    try {
        await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        console.error("Admin verification failed for getSystemSettings:", e.message);
        return { settings: null, error: e.message };
    }

    const supabaseAdmin = createSupabaseAdminClient(); 
    const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('settings')
        .eq('id', 1)
        .single();

    if (error) {
        console.error("Error fetching system settings from DB:", error);
        if (error.code === 'PGRST116') {
            return { settings: {}, error: "System settings not found in database. Default values will be used." };
        }
        return { settings: null, error: `Database error fetching settings: ${error.message}` };
    }
    // Ensure email_provider_settings is an object if it's null or undefined
    const settingsData = (data?.settings as SystemSettings) || {};
    if (!settingsData.email_provider_settings) {
        settingsData.email_provider_settings = {};
    }
    if (!settingsData.email_provider_settings.resend) {
        settingsData.email_provider_settings.resend = {};
    }
    if (!settingsData.email_provider_settings.smtp) {
        settingsData.email_provider_settings.smtp = {};
    }
    return { settings: settingsData };
}


export async function saveSystemSettingsAction(prevState: any, formData: FormData): Promise<{message: string | null; errors?: Partial<Record<keyof SystemSettingsFormData, string[]>> | null; success: boolean; data?: SystemSettings}> {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient();

    let adminActor;
    try {
        adminActor = await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { message: e.message, success: false, errors: null };
    }
    
    const formValues: Record<string, any> = {};
    formData.forEach((value, key) => {
        // Handle nested structure for email_provider_settings
        if (key.startsWith("email_provider_settings.resend.")) {
            const subKey = key.replace("email_provider_settings.resend.", "");
            formValues.email_provider_settings = formValues.email_provider_settings || {};
            formValues.email_provider_settings.resend = formValues.email_provider_settings.resend || {};
            formValues.email_provider_settings.resend[subKey] = value;
        } else if (key.startsWith("email_provider_settings.smtp.")) {
            const subKey = key.replace("email_provider_settings.smtp.", "");
            formValues.email_provider_settings = formValues.email_provider_settings || {};
            formValues.email_provider_settings.smtp = formValues.email_provider_settings.smtp || {};
            formValues.email_provider_settings.smtp[subKey] = value;
        } else {
            formValues[key] = value;
        }
    });
    
    // Adjust boolean values from FormData
    formValues.feature_new_dashboard = formData.get('feature_new_dashboard') === "true";
    formValues.maintenance_mode = formData.get('maintenance_mode') === "true";
    if (formValues.email_provider_settings?.smtp) {
         formValues.email_provider_settings.smtp.secure = formData.get('email_provider_settings.smtp.secure') === "true";
    }


    const result = systemSettingsSchema.safeParse(formValues);

    if (!result.success) {
        console.error("System settings validation error:", result.error.flatten().fieldErrors);
        return { message: 'Invalid data for system settings. Check field requirements.', errors: result.error.flatten().fieldErrors, success: false };
    }

    const newSettings = result.data;
    
    // Clean up sensitive fields if provider is 'none' or not selected
    if (newSettings.email_provider === 'none') {
        newSettings.email_provider_settings = { resend: {}, smtp: {} };
    } else if (newSettings.email_provider === 'resend') {
        newSettings.email_provider_settings = { 
            resend: newSettings.email_provider_settings?.resend || {},
            smtp: {} // Clear SMTP settings
        };
    } else if (newSettings.email_provider === 'smtp') {
         newSettings.email_provider_settings = {
            smtp: newSettings.email_provider_settings?.smtp || {},
            resend: {} // Clear Resend settings
        };
    }


    const { data: currentSettingsData, error: fetchError } = await supabaseAdmin
        .from('system_settings')
        .select('settings')
        .eq('id', 1)
        .maybeSingle(); // Use maybeSingle to handle null if row doesn't exist

    let existingSettings: SystemSettings = {};
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine for upsert
        console.error("Error fetching current settings before save:", fetchError);
        return { message: `Failed to load current settings: ${fetchError.message}`, success: false, errors: null };
    }
    if (currentSettingsData) {
        existingSettings = currentSettingsData.settings as SystemSettings;
    }
    
    const updatedSettingsData: SystemSettings = { 
        ...existingSettings, 
        ...newSettings 
    };
     // Ensure email_provider_settings is properly merged or set
    if (newSettings.email_provider_settings) {
        updatedSettingsData.email_provider_settings = {
            ...existingSettings.email_provider_settings,
            ...newSettings.email_provider_settings,
        };
        if (newSettings.email_provider === 'resend' && newSettings.email_provider_settings.resend) {
            updatedSettingsData.email_provider_settings.resend = newSettings.email_provider_settings.resend;
        }
        if (newSettings.email_provider === 'smtp' && newSettings.email_provider_settings.smtp) {
            updatedSettingsData.email_provider_settings.smtp = newSettings.email_provider_settings.smtp;
        }
    }


    const { data: savedData, error: upsertError } = await supabaseAdmin
        .from('system_settings')
        .upsert({ id: 1, settings: updatedSettingsData as Json, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('settings') 
        .single();

    if (upsertError) {
        console.error("Upsert system settings error:", upsertError);
        return { message: `Failed to save system settings: ${upsertError.message}`, success: false, errors: null };
    }

    await logUserActivity({
        actor_id: adminActor.id,
        user_id: adminActor.id, 
        activity_type: 'ADMIN_SYSTEM_SETTINGS_UPDATE',
        description: `Admin ${adminActor.email} updated system settings.`,
        details: { new: updatedSettingsData, old: existingSettings }, 
        target_resource_id: '1', 
        target_resource_type: 'system_settings'
    });

    revalidatePath('/admin/system');
    const finalSettings = savedData?.settings as SystemSettings || {};
    // Ensure consistent structure for provider settings in returned data
    finalSettings.email_provider_settings = finalSettings.email_provider_settings || { resend: {}, smtp: {} };
    finalSettings.email_provider_settings.resend = finalSettings.email_provider_settings.resend || {};
    finalSettings.email_provider_settings.smtp = finalSettings.email_provider_settings.smtp || {};

    return { message: 'System settings saved successfully!', success: true, errors: null, data: finalSettings };
}


export async function getAdminAnalyticsData(): Promise<{ data: AdminAnalyticsData | null; error?: string }> {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore); 
    const supabaseAdmin = createSupabaseAdminClient(); 

    try {
        await verifyAdminRoleAndGetActor(supabase);
    } catch (e: any) {
        return { data: null, error: e.message };
    }

    try {
        const [
            totalUsersRes,
            activeUsersRes,
            dailySignupsRes,
            roleDistributionRes
        ] = await Promise.all([
            supabaseAdmin.rpc('get_total_users_count'),
            supabaseAdmin.rpc('get_active_users_count', { p_interval: '7 days' }),
            supabaseAdmin.rpc('get_daily_signups', { days_limit: 30 }),
            supabaseAdmin.rpc('get_user_role_distribution')
        ]);
        
        if (totalUsersRes.error) throw new Error(`Workspaceing total users failed: ${totalUsersRes.error.message}`);
        if (activeUsersRes.error) throw new Error(`Workspaceing active users failed: ${activeUsersRes.error.message}`);
        if (dailySignupsRes.error) throw new Error(`Workspaceing daily signups failed: ${dailySignupsRes.error.message}`);
        if (roleDistributionRes.error) throw new Error(`Workspaceing role distribution failed: ${roleDistributionRes.error.message}`);

        const analyticsData: AdminAnalyticsData = {
            totalUsers: totalUsersRes.data ?? 0,
            activeUsersLast7Days: activeUsersRes.data ?? 0,
            dailySignups: (dailySignupsRes.data as DailySignup[] ?? []).map(d => ({...d, signup_date: d.signup_date.split('T')[0]})), // Ensure date format
            userRoleDistribution: (roleDistributionRes.data as UserRoleDistribution[] ?? [])
        };
        
        return { data: analyticsData };

    } catch (error: any) {
        console.error("Error fetching admin analytics data from RPCs:", error);
        return { data: null, error: error.message || "An unexpected error occurred while fetching analytics." };
    }
}
