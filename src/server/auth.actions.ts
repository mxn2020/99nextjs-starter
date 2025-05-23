
"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, magicLinkSchema, changePasswordSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { logUserActivity } from '@/lib/activityLog';

export async function loginWithPassword(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard';

  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid form data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const { email, password } = result.data;

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return { message: error.message, success: false };
  }

  if (data.session) {
    // After successful login, check onboarding status
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', data.session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching profile after login:", profileError.message);
      // Proceed to dashboard, or handle error appropriately
    }

    if (userProfile && !userProfile.onboarding_completed) {
      redirect('/onboarding/step1');
    }
    redirect(redirectTo); // Or use the passed redirectTo
  }

  return { message: 'Login successful!', success: true }; // Should have redirected
}

export async function signupWithPassword(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const redirectTo = formData.get('redirectTo')?.toString() || '/onboarding/step1'; // New users go to onboarding

  const result = signupSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid form data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const { email, password } = result.data;

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: ${process.env.NEXT_PUBLIC_APP_URL}/auth/callback, // Supabase handles this for email verification
      // Data to be stored in auth.users.user_metadata or auth.users.app_metadata if needed
      // data: { display_name: 'New User' } // example if you want to pass initial data
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    return { message: error.message, success: false };
  }

  if (data.session) {
    // User is automatically logged in. Trigger should create profile. Redirect to onboarding.
    redirect(redirectTo);
  } else if (data.user && !data.session) {
    // Email confirmation required
    return { message: 'Please check your email to verify your account.', success: true, requiresConfirmation: true };
  }

  return { message: 'Signup successful! Redirecting...', success: true }; // Should have redirected or shown confirmation
}

export async function loginWithOAuth(provider: 'github' | 'google', redirectTo?: string) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.google.com/search?q=http://localhost:3099';
  let authRedirectTo = `${appUrl}/auth/callback`; // Ensure this matches your Supabase dashboard and route handler path

  if (redirectTo) {
    // Encode the final destination into the OAuth redirect
    const params = new URLSearchParams();
    params.set('next', redirectTo);
    authRedirectTo = `${authRedirectTo}?${params.toString()}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authRedirectTo,
    },
  });

  if (error) {
    console.error(`OAuth ${provider} error:`, error.message);
    // Can't redirect here directly from server action for OAuth, error needs to be handled on client or page
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url); // Redirect to Supabase provider authentication page
  }
  return {}; // Should have redirected
}

export async function loginWithMagicLink(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const redirectToPath = formData.get('redirectTo')?.toString();

  const result = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { message: 'Invalid email format.', errors: result.error.flatten().fieldErrors, success: false };
  }
  const { email } = result.data;

  let emailRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.google.com/search?q=http://localhost:3099'}/auth/callback`;
  if (redirectToPath) {
    const params = new URLSearchParams();
    params.set('next', redirectToPath);
    emailRedirectTo = `${emailRedirectTo}?${params.toString()}`;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: emailRedirectTo, // Supabase will append token etc.
      // shouldCreateUser: true, // default is true, set to false if you only want existing users to use magic link
    },
  });

  if (error) {
    console.error("Magic link error:", error.message);
    return { message: error.message, success: false };
  }

  return { message: 'Magic link sent! Check your email.', success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
    // Even if error, try to redirect
  }
  redirect('/login?message=Successfully logged out.');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*') // Select all profile fields
    .eq('id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { //PGRST116: 0 rows (profile not found)
    console.error('Error fetching user profile:', error);
    return { ...session.user, profile: null }; // Return auth user even if profile fetch fails
  }

  return { ...session.user, profile: userProfile };
}

export async function getUserRole() {
  const user = await getCurrentUser();
  return user?.profile?.role || null;
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'User not authenticated.', success: false, errors: null };
  }

  const result = changePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid data.', errors: result.error.flatten().fieldErrors, success: false };
  }

  const { newPassword } = result.data;

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Change password error:", updateError);
    return { message: `Failed to update password: ${updateError.message}`, success: false, errors: null };
  }

  await logUserActivity({
    actor_id: user.id,
    user_id: user.id,
    activity_type: 'USER_PASSWORD_UPDATE',
    description: 'User updated their password.',
    target_resource_id: user.id,
    target_resource_type: 'user_security' // Using 'user_security' as a general type for such actions
  });

  revalidatePath('/dashboard/settings');
  return { message: 'Password updated successfully!', success: true, errors: null };
}
