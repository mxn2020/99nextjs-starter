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
});

export const adminCreateUserSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    role: z.enum(['user', 'admin']).default('user'),
    display_name: z.string().min(2, 'Display name is too short.').max(50, 'Display name is too long.').optional().or(z.literal('')),
    onboarding_completed: z.boolean().default(false).optional(),
});

export const accountPreferencesFormSchema = z.object({
    notifications_enabled: z.boolean().default(true).optional(),
    preferred_language: z.string().min(2).max(10).default('en').optional(),
    interface_density: z.enum(['compact', 'default', 'comfortable']).default('default').optional(),
});

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

// --- System Settings Schema ---
const resendSettingsSchema = z.object({
    api_key: z.string().optional(), // Sensitive, TODO: consider secure storage/handling
    default_from_email: z.string().email("Invalid Resend 'From' email").optional().or(z.literal('')),
});

const smtpSettingsSchema = z.object({
    host: z.string().optional().or(z.literal('')),
    port: z.coerce.number().int().positive("Port must be a positive number").optional(),
    user: z.string().optional().or(z.literal('')),
    password: z.string().optional(), // Sensitive, TODO: consider secure storage/handling
    secure: z.preprocess(value => value === 'on' || value === true || value === "true", z.boolean().default(true)).optional(),
    default_from_email: z.string().email("Invalid SMTP 'From' email").optional().or(z.literal('')),
});

const smtpSettingsFormSchema = z.object({
    host: z.string().optional().or(z.literal('')),
    port: z.coerce.number().int().positive("Port must be a positive number").optional(),
    user: z.string().optional().or(z.literal('')),
    password: z.string().optional(), // Sensitive, TODO: consider secure storage/handling
    secure: z.boolean().default(true).optional(),
    default_from_email: z.string().email("Invalid SMTP 'From' email").optional().or(z.literal('')),
});

export const systemSettingsSchema = z.object({
    feature_new_dashboard: z.preprocess(value => value === 'on' || value === true || value === "true", z.boolean().default(false)).optional(),
    maintenance_mode: z.preprocess(value => value === 'on' || value === true || value === "true", z.boolean().default(false)).optional(),
    default_items_per_page: z.coerce
        .number({ invalid_type_error: "Must be a number" })
        .int({ message: "Must be a whole number" })
        .min(5, { message: "Minimum 5 items per page" })
        .max(100, { message: "Maximum 100 items per page" })
        .default(10)
        .optional(),
    email_provider: z.enum(['none', 'resend', 'smtp']).default('none').optional(),
    default_from_name: z.string().max(100, "From Name too long").optional().or(z.literal('')),
    email_provider_settings: z.object({
        resend: resendSettingsSchema.optional(),
        smtp: smtpSettingsSchema.optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.email_provider === 'resend') {
        if (!data.email_provider_settings?.resend?.api_key) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Resend API Key is required when Resend is selected.",
                path: ["email_provider_settings", "resend", "api_key"],
            });
        }
        if (!data.email_provider_settings?.resend?.default_from_email) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Resend Default From Email is required.",
                path: ["email_provider_settings", "resend", "default_from_email"],
            });
        }
    }
    if (data.email_provider === 'smtp') {
        if (!data.email_provider_settings?.smtp?.host) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Host is required.", path: ["email_provider_settings", "smtp", "host"] });
        }
        if (!data.email_provider_settings?.smtp?.port) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Port is required.", path: ["email_provider_settings", "smtp", "port"] });
        }
        if (!data.email_provider_settings?.smtp?.default_from_email) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Default From Email is required.", path: ["email_provider_settings", "smtp", "default_from_email"] });
        }
        // User/Pass for SMTP might be optional depending on auth method
    }
});

export const systemSettingsFormSchema = z.object({
    feature_new_dashboard: z.boolean().default(true).optional(),
    maintenance_mode: z.boolean().default(true).optional(),
    default_items_per_page: z.coerce
        .number({ invalid_type_error: "Must be a number" })
        .int({ message: "Must be a whole number" })
        .min(5, { message: "Minimum 5 items per page" })
        .max(100, { message: "Maximum 100 items per page" })
        .default(10)
        .optional(),
    email_provider: z.enum(['none', 'resend', 'smtp']).default('none').optional(),
    default_from_name: z.string().max(100, "From Name too long").optional().or(z.literal('')),
    email_provider_settings: z.object({
        resend: resendSettingsSchema.optional(),
        smtp: smtpSettingsFormSchema.optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.email_provider === 'resend') {
        if (!data.email_provider_settings?.resend?.api_key) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Resend API Key is required when Resend is selected.",
                path: ["email_provider_settings", "resend", "api_key"],
            });
        }
        if (!data.email_provider_settings?.resend?.default_from_email) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Resend Default From Email is required.",
                path: ["email_provider_settings", "resend", "default_from_email"],
            });
        }
    }
    if (data.email_provider === 'smtp') {
        if (!data.email_provider_settings?.smtp?.host) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Host is required.", path: ["email_provider_settings", "smtp", "host"] });
        }
        if (!data.email_provider_settings?.smtp?.port) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Port is required.", path: ["email_provider_settings", "smtp", "port"] });
        }
        if (!data.email_provider_settings?.smtp?.default_from_email) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP Default From Email is required.", path: ["email_provider_settings", "smtp", "default_from_email"] });
        }
        // User/Pass for SMTP might be optional depending on auth method
    }
});


export type SystemSettingsFormData = z.infer<typeof systemSettingsFormSchema>;
