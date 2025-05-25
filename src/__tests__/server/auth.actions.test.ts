
import { loginWithPassword, signupWithPassword, logout, getCurrentUser } from '@/server/auth.actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/activityLog', () => ({
  logUserActivity: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(new Map())),
}))

const mockSingle = jest.fn()
const mockEq = jest.fn(() => ({ single: mockSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockUpdate = jest.fn(() => ({ eq: jest.fn() }))
const mockInsert = jest.fn(() => ({ select: jest.fn() }))
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
}))

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
  from: mockFrom,
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
}

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSingle.mockClear()
    mockEq.mockClear()
    mockSelect.mockClear()
    mockUpdate.mockClear()
    mockInsert.mockClear()
    mockFrom.mockClear()
    ;(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('loginWithPassword', () => {
    it('should login successfully and redirect', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
      }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      
      mockSingle.mockResolvedValue({
        data: { onboarding_completed: true },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      const result = await loginWithPassword({}, formData)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should redirect to onboarding if not completed', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
      }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      
      mockSingle.mockResolvedValue({
        data: { onboarding_completed: false },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      await loginWithPassword({}, formData)

      expect(redirect).toHaveBeenCalledWith('/onboarding/step1')
    })

    it('should return error for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid credentials' },
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')

      const result = await loginWithPassword({}, formData)

      expect(result).toEqual({
        message: 'Invalid credentials',
        success: false,
      })
    })

    it('should validate form data', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', '')

      const result = await loginWithPassword({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('signupWithPassword', () => {
    it('should signup successfully and redirect', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
      }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'password123')

      await signupWithPassword({}, formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: expect.any(Object),
      })
      expect(redirect).toHaveBeenCalledWith('/onboarding/step1')
    })

    it('should return confirmation message when email verification required', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { 
          session: null, 
          user: { id: '123', email: 'test@example.com' }
        },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'password123')

      const result = await signupWithPassword({}, formData)

      expect(result).toEqual({
        message: 'Please check your email to verify your account.',
        success: true,
        requiresConfirmation: true,
      })
    })

    it('should validate password confirmation', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'different123')

      const result = await signupWithPassword({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors?.confirmPassword).toContain("Passwords don't match.")
    })

    it('should return error for existing email', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'User already registered' },
      })

      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'password123')
      formData.append('confirmPassword', 'password123')

      const result = await signupWithPassword({}, formData)

      expect(result).toEqual({
        message: 'User already registered',
        success: false,
      })
    })
  })

  describe('logout', () => {
    it('should logout successfully and redirect', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await logout()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith('/login?message=Successfully logged out.')
    })

    it('should redirect even if logout fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      await logout()

      expect(redirect).toHaveBeenCalledWith('/login?message=Successfully logged out.')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user with profile', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockProfile = {
        id: '123',
        display_name: 'John Doe',
        role: 'user',
        onboarding_completed: true
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        ...mockUser,
        profile: mockProfile,
      })
    })

    it('should return null when no user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it('should return user with null profile if profile not found', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        ...mockUser,
        profile: null,
      })
    })

    it('should handle profile fetch error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: 'Database error' },
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        ...mockUser,
        profile: null,
      })
    })
  })
})
