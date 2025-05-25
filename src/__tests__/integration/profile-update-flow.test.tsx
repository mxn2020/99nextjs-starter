import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileForm from '@/components/user/ProfileForm'
import ChangePasswordForm from '@/components/user/ChangePasswordForm'
import AccountPreferencesForm from '@/components/user/AccountPreferencesForm'

jest.mock('@/server/user.actions', () => ({
  updateUserProfileServerAction: jest.fn(),
  saveUserPreferencesAction: jest.fn(),
}))

jest.mock('@/server/auth.actions', () => ({
  changePasswordAction: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUserProfile = {
  id: '123',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  email: 'test@example.com',
  role: 'user' as const,
  onboarding_completed: true,
  onboarding_step: 0,
  preferences: {
    notifications_enabled: true,
    preferred_language: 'en',
    interface_density: 'default' as const
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('Profile Update Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Profile Information Update', () => {
    const defaultProps = {
      userProfile: mockUserProfile,
      userId: '123',
      userEmail: 'test@example.com'
    }

    it('should successfully update profile information', async () => {
      const { updateUserProfileServerAction } = require('@/server/user.actions')
      updateUserProfileServerAction.mockReturnValue(Promise.resolve({
        message: 'Profile updated successfully!',
        success: true,
        errors: null
      }))

      render(<ProfileForm {...defaultProps} />)
      
      const displayNameInput = screen.getByDisplayValue('John Doe')
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      
      fireEvent.change(displayNameInput, { target: { value: 'Jane Smith' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(updateUserProfileServerAction).toHaveBeenCalled()
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })

    it('should handle profile update validation errors', async () => {
      const { updateUserProfileServerAction } = require('@/server/user.actions')
      updateUserProfileServerAction.mockReturnValue(Promise.resolve({
        message: 'Validation failed',
        success: false,
        errors: {
          display_name: ['Display name is required']
        }
      }))

      render(<ProfileForm {...defaultProps} />)
      
      const displayNameInput = screen.getByDisplayValue('John Doe')
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      
      fireEvent.change(displayNameInput, { target: { value: '' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument()
      })
    })

    it('should handle avatar upload process', async () => {
      const { updateUserProfileServerAction } = require('@/server/user.actions')
      updateUserProfileServerAction.mockReturnValue(Promise.resolve({
        message: 'Profile updated successfully!',
        success: true,
        errors: null
      }))

      render(<ProfileForm {...defaultProps} />)
      
      // Check that avatar upload component is present
      expect(screen.getByText(/change avatar/i)).toBeInTheDocument()
      
      // Simulate form submission
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(updateUserProfileServerAction).toHaveBeenCalled()
      })
    })
  })

  describe('Password Change Flow', () => {
    it('should successfully change password', async () => {
      const { changePasswordAction } = require('@/server/auth.actions')
      changePasswordAction.mockReturnValue(Promise.resolve({
        message: 'Password updated successfully!',
        success: true,
        errors: null
      }))

      render(<ChangePasswordForm />)
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const submitButton = screen.getByRole('button', { name: /update password/i })
      
      fireEvent.change(newPasswordInput, { target: { value: 'newSecurePassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newSecurePassword123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(changePasswordAction).toHaveBeenCalled()
        expect(screen.getByText('Password updated successfully!')).toBeInTheDocument()
      })
    })

    it('should validate password confirmation match', async () => {
      const { changePasswordAction } = require('@/server/auth.actions')
      changePasswordAction.mockReturnValue(Promise.resolve({
        message: 'Validation failed',
        success: false,
        errors: {
          confirmNewPassword: ['Passwords do not match']
        }
      }))

      render(<ChangePasswordForm />)
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const submitButton = screen.getByRole('button', { name: /update password/i })
      
      fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })

    it('should clear form after successful password change', async () => {
      const { changePasswordAction } = require('@/server/auth.actions')
      changePasswordAction.mockReturnValue(Promise.resolve({
        message: 'Password updated successfully!',
        success: true,
        errors: null
      }))

      render(<ChangePasswordForm />)
      
      const newPasswordInput = screen.getByLabelText(/new password/i) as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /update password/i })
      
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(newPasswordInput.value).toBe('')
        expect(confirmPasswordInput.value).toBe('')
      })
    })
  })

  describe('Account Preferences Update', () => {
    it('should successfully update user preferences', async () => {
      const { saveUserPreferencesAction } = require('@/server/user.actions')
      saveUserPreferencesAction.mockReturnValue(Promise.resolve({
        message: 'Preferences saved successfully!',
        success: true,
        errors: null
      }))

      render(<AccountPreferencesForm currentPreferences={mockUserProfile.preferences} />)
      
      const notificationsSwitch = screen.getByRole('switch')
      const submitButton = screen.getByRole('button', { name: /save preferences/i })
      
      fireEvent.click(notificationsSwitch)
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveUserPreferencesAction).toHaveBeenCalled()
        expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument()
      })
    })

    it('should handle preference validation errors', async () => {
      const { saveUserPreferencesAction } = require('@/server/user.actions')
      saveUserPreferencesAction.mockReturnValue(Promise.resolve({
        message: 'Invalid preferences',
        success: false,
        errors: {
          preferred_language: ['Invalid language code']
        }
      }))

      render(<AccountPreferencesForm currentPreferences={{}} />)
      
      const submitButton = screen.getByRole('button', { name: /save preferences/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid language code')).toBeInTheDocument()
      })
    })

    it('should update multiple preference settings', async () => {
      const { saveUserPreferencesAction } = require('@/server/user.actions')
      saveUserPreferencesAction.mockReturnValue(Promise.resolve({
        message: 'Preferences saved successfully!',
        success: true,
        errors: null
      }))

      render(<AccountPreferencesForm currentPreferences={mockUserProfile.preferences} />)
      
      // Toggle notifications
      const notificationsSwitch = screen.getByRole('switch')
      fireEvent.click(notificationsSwitch)
      
      // Change language
      const languageSelect = screen.getByRole('combobox', { name: /preferred language/i })
      fireEvent.click(languageSelect)
      const spanishOption = screen.getByText('Español (Spanish)')
      fireEvent.click(spanishOption)
      
      // Change interface density
      const densitySelect = screen.getByRole('combobox', { name: /interface density/i })
      fireEvent.click(densitySelect)
      const compactOption = screen.getByText('Compact')
      fireEvent.click(compactOption)
      
      const submitButton = screen.getByRole('button', { name: /save preferences/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveUserPreferencesAction).toHaveBeenCalled()
      })
    })
  })

  describe('Complete Profile Update Flow', () => {
    it('should handle sequential updates across different forms', async () => {
      const userActions = require('@/server/user.actions')
      const authActions = require('@/server/auth.actions')
      
      // Mock successful responses
      userActions.updateUserProfileServerAction.mockReturnValue(Promise.resolve({
        message: 'Profile updated successfully!',
        success: true,
        errors: null
      }))
      
      authActions.changePasswordAction.mockReturnValue(Promise.resolve({
        message: 'Password updated successfully!',
        success: true,
        errors: null
      }))
      
      userActions.saveUserPreferencesAction.mockReturnValue(Promise.resolve({
        message: 'Preferences saved successfully!',
        success: true,
        errors: null
      }))

      // Test profile update
      const { rerender } = render(
        <ProfileForm 
          userProfile={mockUserProfile}
          userId="123"
          userEmail="test@example.com"
        />
      )
      
      fireEvent.change(screen.getByDisplayValue('John Doe'), { 
        target: { value: 'John Updated' } 
      })
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
      
      await waitFor(() => {
        expect(userActions.updateUserProfileServerAction).toHaveBeenCalled()
      })

      // Test password change
      rerender(<ChangePasswordForm />)
      
      fireEvent.change(screen.getByLabelText(/new password/i), { 
        target: { value: 'newPassword123' } 
      })
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
        target: { value: 'newPassword123' } 
      })
      fireEvent.click(screen.getByRole('button', { name: /update password/i }))
      
      await waitFor(() => {
        expect(authActions.changePasswordAction).toHaveBeenCalled()
      })

      // Test preferences update
      rerender(<AccountPreferencesForm currentPreferences={mockUserProfile.preferences} />)
      
      fireEvent.click(screen.getByRole('switch'))
      fireEvent.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        expect(userActions.saveUserPreferencesAction).toHaveBeenCalled()
      })
    })
  })
})
