
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
// Define Zod schema for preferences collected in step 2
// Example:
// notifications_enabled: z.boolean().default(true),
// preferred_theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export const onboardingStep3Schema = z.object({
// Define Zod schema for customizations in step 3
// Example:
// data_sharing_consent: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
display_name: z.string().min(2, 'Display name must be at least 2 characters.').max(50, 'Display name too long.').optional(),
// avatar_url will be a string URL after upload
});

export const adminCreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['user', 'admin']).default('user'),
  display_name: z.string().min(2, 'Display name is too short.').max(50, 'Display name is too long.').optional().or(z.literal('')),
  onboarding_completed: z.boolean().default(false).optional(),
});
    