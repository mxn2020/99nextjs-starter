import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  // redirectTo is not part of the schema for validation but handled in action
});

export const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' })
  // .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  // .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  // .regex(/[0-9]/, { message: "Password must contain at least one number." })
  // .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." })
  ,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'], // path of error
});

export const magicLinkSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

export const onboardingStep1Schema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters.').max(50, 'Display name too long.'),
  // avatar_url is handled as a file upload, not direct Zod string validation here for the file itself.
  // The string URL from storage would be validated elsewhere if needed.
});

export const onboardingStep2Schema = z.object({
  notifications_enabled: z.preprocess(value => value === 'on' || value === true || value === "true", z.boolean().default(true)),
  contact_method: z.enum(['email', 'inapp', 'none']).default('email'),
  preferred_language: z.string().min(2, "Language code too short").max(10, "Language code too long").optional().default('en'),
});

export const onboardingStep3Schema = z.object({
  bio: z.string().max(250, "Bio cannot exceed 250 characters.").optional().nullable(),
  feature_beta_access: z.preprocess(value => value === 'on' || value === true || value === "true", z.boolean().default(false)),
  privacy_level: z.enum(['public', 'private', 'friends_only']).default('private'),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters.').max(50, 'Display name too long.').optional().or(z.literal('')),
  // avatar_url will be a string URL after upload
});

export const adminCreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['user', 'admin']).default('user'),
  display_name: z.string().min(2, 'Display name is too short.').max(50, 'Display name is too long.').optional().or(z.literal('')),
  onboarding_completed: z.boolean().default(false).optional(),
});

// Schema for form validation (used by react-hook-form)
export const accountPreferencesFormSchema = z.object({
  notifications_enabled: z.boolean().default(true).optional(),
  preferred_language: z.string().min(2).max(10).default('en').optional(),
  interface_density: z.enum(['compact', 'default', 'comfortable']).default('default').optional(),
});

// Schema for server action data processing (handles 'on' from FormData for boolean)
export const accountPreferencesSchema = z.object({
  notifications_enabled: z.preprocess(
    value => value === 'on' || value === true || value === "true",
    z.boolean().default(true)
  ).optional(),
  preferred_language: z.string().min(2).max(10).default('en').optional(),
  interface_density: z.enum(['compact', 'default', 'comfortable']).default('default').optional(),
});

export type AccountPreferencesFormData = z.infer<typeof accountPreferencesFormSchema>;

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ['confirmNewPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const deleteAccountConfirmationSchema = z.object({
    confirmationPhrase: z.string().refine(val => val === "DELETE MY ACCOUNT", {
        message: "To confirm deletion, you must type 'DELETE MY ACCOUNT'."
    })
});
export type DeleteAccountConfirmationFormData = z.infer<typeof deleteAccountConfirmationSchema>;
