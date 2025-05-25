
import { updateUserProfileServerAction, saveUserPreferencesAction } from '@/server/user.actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/activityLog', () => ({
  logUserActivity: jest.fn(),
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

describe('User Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('updateUserProfileServerAction', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')

      const result = await updateUserProfileServerAction({}, formData)

      expect(result).toEqual({
        message: 'Profile updated successfully!',
        success: true,
        errors: null,
      })
    })

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')

      const result = await updateUserProfileServerAction({}, formData)

      expect(result).toEqual({
        message: 'User not authenticated.',
        success: false,
        errors: null,
      })
    })

    it('should validate form data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'X') // Too short

      const result = await updateUserProfileServerAction({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should handle avatar upload', async () => {
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

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')
      formData.append('avatar_file', new File([''], 'avatar.jpg', { type: 'image/jpeg' }))

      const result = await updateUserProfileServerAction({}, formData)

      expect(mockSupabase.storage.from().upload).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle avatar upload error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')
      formData.append('avatar_file', new File([''], 'avatar.jpg', { type: 'image/jpeg' }))

      const result = await updateUserProfileServerAction({}, formData)

      expect(result).toEqual({
        message: 'Avatar upload failed: Upload failed',
        success: false,
        errors: null,
      })
    })

    it('should handle database update error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')

      const result = await updateUserProfileServerAction({}, formData)

      expect(result).toEqual({
        message: 'Database error',
        success: false,
        errors: null,
      })
    })
  })

  describe('saveUserPreferencesAction', () => {
    it('should save preferences successfully', async () => {
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
      formData.append('preferred_language', 'en')
      formData.append('interface_density', 'compact')

      const result = await saveUserPreferencesAction({}, formData)

      expect(result).toEqual({
        message: 'Preferences saved successfully!',
        success: true,
        errors: null,
      })
    })

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'true')

      const result = await saveUserPreferencesAction({}, formData)

      expect(result).toEqual({
        message: 'User not authenticated.',
        success: false,
        errors: null,
      })
    })

    it('should validate preference data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('preferred_language', 'x') // Too short

      const result = await saveUserPreferencesAction({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should merge with existing preferences', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const existingPreferences = {
        notifications_enabled: false,
        interface_density: 'default'
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { preferences: existingPreferences },
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'true')
      formData.append('preferred_language', 'es')

      const result = await saveUserPreferencesAction({}, formData)

      expect(result.success).toBe(true)
      
      // Verify the update call merged preferences correctly
      const updateCall = mockSupabase.from().update
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({
            notifications_enabled: true,
            preferred_language: 'es',
            interface_density: 'default', // Should preserve existing
          }),
        })
      )
    })

    it('should handle database error when fetching existing preferences', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: 'Database error' },
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'true')

      const result = await saveUserPreferencesAction({}, formData)

      expect(result).toEqual({
        message: 'Could not load existing preferences.',
        success: false,
        errors: null,
      })
    })

    it('should handle database error when updating preferences', async () => {
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
        error: { message: 'Update failed' },
      })

      const formData = new FormData()
      formData.append('notifications_enabled', 'true')

      const result = await saveUserPreferencesAction({}, formData)

      expect(result).toEqual({
        message: 'Failed to save preferences: Update failed',
        success: false,
        errors: null,
      })
    })
  })
})
