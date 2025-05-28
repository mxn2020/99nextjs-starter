import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileForm from '@/components/user/ProfileForm'

jest.mock('@/server/user.actions', () => ({
  updateUserProfileServerAction: jest.fn(),
}))

const mockUserProfile = {
  id: '123',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  email: 'test@example.com',
  role: 'user' as const,
  onboarding_completed: true,
  onboarding_step: 0,
  preferences: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('ProfileForm', () => {
  const defaultProps = {
    userProfile: mockUserProfile,
    userId: '123',
    userEmail: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render profile form with user data', () => {
    render(<ProfileForm {...defaultProps} />)
    
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('should disable email field', () => {
    render(<ProfileForm {...defaultProps} />)
    
    const emailInput = screen.getByDisplayValue('test@example.com')
    expect(emailInput).toBeDisabled()
  })

  it('should display success message when profile updated', async () => {
    const userActions = await import('@/server/user.actions')
    const updateUserProfileServerAction = userActions.updateUserProfileServerAction as jest.Mock
    updateUserProfileServerAction.mockReturnValue(Promise.resolve({
      message: 'Profile updated successfully!',
      success: true,
      errors: null
    }))

    render(<ProfileForm {...defaultProps} />)
    
    const displayNameInput = screen.getByDisplayValue('John Doe')
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    
    fireEvent.change(displayNameInput, { target: { value: 'Jane Doe' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })
  })

  it('should display error message when update fails', async () => {
    const userActions = await import('@/server/user.actions')
    const updateUserProfileServerAction = userActions.updateUserProfileServerAction as jest.Mock
    updateUserProfileServerAction.mockReturnValue(Promise.resolve({
      message: 'Failed to update profile',
      success: false,
      errors: null
    }))

    render(<ProfileForm {...defaultProps} />)
    
    const displayNameInput = screen.getByDisplayValue('John Doe')
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    
    fireEvent.change(displayNameInput, { target: { value: 'Jane Doe' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
  })

  it('should show field errors when validation fails', async () => {
    const userActions = await import('@/server/user.actions')
    const updateUserProfileServerAction = userActions.updateUserProfileServerAction as jest.Mock
    updateUserProfileServerAction.mockReturnValue(Promise.resolve({
      message: 'Validation failed',
      success: false,
      errors: {
        display_name: ['Display name too short']
      }
    }))

    render(<ProfileForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Display name too short')).toBeInTheDocument()
    })
  })

  it('should handle avatar upload', () => {
    render(<ProfileForm {...defaultProps} />)
    
    expect(screen.getByText(/change avatar/i)).toBeInTheDocument()
  })

  it('should show email change notice', () => {
    render(<ProfileForm {...defaultProps} />)
    
    expect(screen.getByText(/email address cannot be changed here/i)).toBeInTheDocument()
  })
})
