
import { saveOnboardingStep1, saveOnboardingStep2, saveOnboardingStep3, completeOnboarding } from '@/server/onboarding.actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

jest.mock('@/lib/supabase/server')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(new Map())),
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
}

describe('Onboarding Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('saveOnboardingStep1', () => {
    it('should save step 1 and redirect to step 2', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'John Doe')

      await saveOnboardingStep1({}, formData)

      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: 'John Doe',
          onboarding_step: 2,
        }),
        '123'
      )
      expect(redirect).toHaveBeenCalledWith('/onboarding/step2')
    })

    it('should handle avatar upload in step 1', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'avatars/123/avatar.jpg' },
        error: null,
      })

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'John Doe')
      formData.append('avatar_url', new File([''], 'avatar.jpg', { type: 'image/jpeg' }))

      await saveOnboardingStep1({}, formData)

      expect(mockSupabase.storage.from().upload).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith('/onboarding/step2')
    })

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'John Doe')

      const result = await saveOnboardingStep1({}, formData)

      expect(result).toEqual({
        message: 'User not authenticated.',
        success: false,
        errors: null,
      })
    })

    it('should validate display name', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'X') // Too short

      const result = await saveOnboardingStep1({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors?.display_name).toBeDefined()
    })
  })

  describe('saveOnboardingStep2', () => {
    it('should save step 2 preferences and redirect to step 3', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'true')
      formData.append('contact_method', 'email')
      formData.append('preferred_language', 'en')

      await saveOnboardingStep2({}, formData)

      expect(redirect).toHaveBeenCalledWith('/onboarding/step3')
    })

    it('should handle boolean preprocessing', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'on')
      formData.append('contact_method', 'email')
      formData.append('preferred_language', 'en')

      await saveOnboardingStep2({}, formData)

      // Verify that 'on' was converted to true
      const updateCall = mockSupabase.from().update().eq
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({
            notifications_enabled: true,
          }),
        }),
        '123'
      )
    })

    it('should validate step 2 data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('contact_method', 'invalid')

      const result = await saveOnboardingStep2({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('saveOnboardingStep3', () => {
    it('should save step 3 preferences and redirect to step 4', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('bio', 'I am a developer')
      formData.append('feature_beta_access', 'true')
      formData.append('privacy_level', 'private')

      await saveOnboardingStep3({}, formData)

      expect(redirect).toHaveBeenCalledWith('/onboarding/step4')
    })

    it('should validate bio length', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('bio', 'A'.repeat(251)) // Too long

      const result = await saveOnboardingStep3({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors?.bio).toBeDefined()
    })

    it('should handle empty bio', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('bio', '')
      formData.append('privacy_level', 'private')

      await saveOnboardingStep3({}, formData)

      expect(redirect).toHaveBeenCalledWith('/onboarding/step4')
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding and redirect to dashboard', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      await completeOnboarding()

      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed: true,
          onboarding_step: 0,
        }),
        '123'
      )
      expect(redirect).toHaveBeenCalledWith('/dashboard?onboarding=completed')
    })

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await completeOnboarding()

      expect(redirect).toHaveBeenCalledWith('/login?message=Authentication required.')
    })

    it('should handle database error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      await completeOnboarding()

      expect(redirect).toHaveBeenCalledWith('/onboarding/step4?error=Database%20error')
    })
  })
})
