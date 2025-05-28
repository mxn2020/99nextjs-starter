import { z } from 'zod'

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().url().nullable(),
  location: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(['user', 'admin']),
  email_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const userInsertSchema = userSchema.omit({
  created_at: true,
  updated_at: true,
}).extend({
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const userUpdateSchema = userInsertSchema.partial().extend({
  id: z.string().uuid().optional(),
})

// Account schemas
export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['personal', 'team', 'family', 'enterprise']),
  owner_id: z.string().uuid(),
  settings: z.any().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const accountInsertSchema = accountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const accountUpdateSchema = accountInsertSchema.partial().extend({
  id: z.string().uuid().optional(),
})

// Note schemas
export const noteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().nullable(),
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  is_public: z.boolean(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const noteInsertSchema = noteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const noteUpdateSchema = noteInsertSchema.partial().extend({
  id: z.string().uuid().optional(),
})

// User account schemas
export const userAccountSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']),
  created_at: z.string(),
})

export const userAccountInsertSchema = userAccountSchema.omit({
  id: true,
  created_at: true,
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
})

// Form schemas
export const createNoteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
})

export const updateNoteFormSchema = createNoteFormSchema.partial().extend({
  id: z.string().uuid(),
})

export const createAccountFormSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['personal', 'team', 'family', 'enterprise']),
})

export const updateProfileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  avatarUrl: z.string().url('Invalid URL format').optional(),
})

// Query schemas
export const notesFilterSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  userId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
})

export const sortOptionsSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']),
})

export const queryOptionsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sort: sortOptionsSchema.optional(),
})

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = signInSchema.extend({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Export types
export type CreateNoteForm = z.infer<typeof createNoteFormSchema>
export type UpdateNoteForm = z.infer<typeof updateNoteFormSchema>
export type CreateAccountForm = z.infer<typeof createAccountFormSchema>
export type UpdateProfileForm = z.infer<typeof updateProfileFormSchema>
export type NotesFilter = z.infer<typeof notesFilterSchema>
export type SortOptions = z.infer<typeof sortOptionsSchema>
export type QueryOptions = z.infer<typeof queryOptionsSchema>
export type SignInForm = z.infer<typeof signInSchema>
export type SignUpForm = z.infer<typeof signUpSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>
