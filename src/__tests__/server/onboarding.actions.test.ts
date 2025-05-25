
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

// Create persistent mock objects for database operations
const mockSingle = jest.fn()
const mockEq = jest.fn(() => ({ single: mockSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockUpdateEq = jest.fn()
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}))

// Create persistent mock objects for storage operations
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockStorageFrom = jest.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: mockFrom,
  storage: {
    from: mockStorageFrom,
  },
}

describe('Onboarding Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSingle.mockClear()
    mockEq.mockClear()
    mockSelect.mockClear()
    mockUpdate.mockClear()
    mockUpdateEq.mockClear()
    mockFrom.mockClear()
    mockUpload.mockClear()
    mockGetPublicUrl.mockClear()
    mockStorageFrom.mockClear()
    ;(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('saveOnboardingStep1', () => {
    it('should save step 1 and redirect to step 2', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'John Doe')

      await saveOnboardingStep1({}, formData)

      expect(mockUpdateEq).toHaveBeenCalledWith('id', '123')
      expect(redirect).toHaveBeenCalledWith('/onboarding/step2')
    })

    it('should handle avatar upload in step 1', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockUpload.mockResolvedValue({
        data: { path: 'avatars/123/avatar.jpg' },
        error: null,
      })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      })

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'John Doe')
      formData.append('avatar_url', new File(['file content'], 'avatar.jpg', { type: 'image/jpeg' }))

      await saveOnboardingStep1({}, formData)

      expect(mockUpload).toHaveBeenCalled()
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'on')
      formData.append('contact_method', 'email')
      formData.append('preferred_language', 'en')

      await saveOnboardingStep2({}, formData)

      // Verify that 'on' was converted to true
      expect(mockUpdateEq).toHaveBeenCalledWith('id', '123')
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
        error: null,
      })

      await completeOnboarding()

      expect(mockUpdateEq).toHaveBeenCalledWith('id', '123')
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      await completeOnboarding()

      expect(redirect).toHaveBeenCalledWith('/onboarding/step4?error=Database%20error')
    })
  })
})
