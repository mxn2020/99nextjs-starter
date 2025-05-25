
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

const mockSingle = jest.fn()
const mockEq = jest.fn(() => ({ single: mockSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockUpdateEq = jest.fn()
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }))
const mockInsert = jest.fn(() => ({ select: jest.fn() }))
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
}))

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

describe('User Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSingle.mockClear()
    mockEq.mockClear()
    mockSelect.mockClear()
    mockUpdate.mockClear()
    mockUpdateEq.mockClear()
    mockInsert.mockClear()
    mockFrom.mockClear()
    mockUpload.mockClear()
    mockGetPublicUrl.mockClear()
    mockStorageFrom.mockClear()
    ;(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('updateUserProfileServerAction', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockUpload.mockResolvedValue({
        data: { path: 'avatars/123/avatar.jpg' },
        error: null,
      })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      })

      mockUpdateEq.mockResolvedValue({
        error: null,
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')
      formData.append('avatar_file', new File(['file content'], 'avatar.jpg', { type: 'image/jpeg' }))

      const result = await updateUserProfileServerAction({}, formData)

      expect(mockUpload).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle avatar upload error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      })

      const formData = new FormData()
      formData.append('display_name', 'Updated Name')
      formData.append('avatar_file', new File(['file content'], 'avatar.jpg', { type: 'image/jpeg' }))

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

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: existingPreferences },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
        data: { preferences: {} },
        error: null,
      })

      mockUpdateEq.mockResolvedValue({
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
