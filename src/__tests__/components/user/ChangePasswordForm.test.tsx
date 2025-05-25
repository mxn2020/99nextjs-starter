
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChangePasswordForm from '@/components/user/ChangePasswordForm'

jest.mock('@/server/auth.actions', () => ({
  changePasswordAction: jest.fn(),
}))

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render password change form fields', () => {
    render(<ChangePasswordForm />)
    
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })

  it('should display success message when password updated', async () => {
    const authActions = await import('@/server/auth.actions')
    const changePasswordAction = authActions.changePasswordAction as jest.Mock
    changePasswordAction.mockReturnValue(Promise.resolve({
      message: 'Password updated successfully!',
      success: true,
      errors: null
    }))

    render(<ChangePasswordForm />)
    
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password updated successfully!')).toBeInTheDocument()
    })
  })

  it('should display error message when update fails', async () => {
    const authActions = await import('@/server/auth.actions')
    const changePasswordAction = authActions.changePasswordAction as jest.Mock
    changePasswordAction.mockReturnValue(Promise.resolve({
      message: 'Failed to update password',
      success: false,
      errors: null
    }))

    render(<ChangePasswordForm />)
    
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update password')).toBeInTheDocument()
    })
  })

  it('should show field errors when validation fails', async () => {
    const authActions = await import('@/server/auth.actions')
    const changePasswordAction = authActions.changePasswordAction as jest.Mock
    changePasswordAction.mockReturnValue(Promise.resolve({
      message: 'Validation failed',
      success: false,
      errors: {
        newPassword: ['New password must be at least 8 characters long.']
      }
    }))

    render(<ChangePasswordForm />)
    
    const submitButton = screen.getByRole('button', { name: /update password/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('New password must be at least 8 characters long.')).toBeInTheDocument()
    })
  })

  it('should reset form after successful update', async () => {
    const authActions = await import('@/server/auth.actions')
    const changePasswordAction = authActions.changePasswordAction as jest.Mock
    changePasswordAction.mockReturnValue(Promise.resolve({
      message: 'Password updated successfully!',
      success: true,
      errors: null
    }))

    render(<ChangePasswordForm />)
    
    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(newPasswordInput.value).toBe('')
      expect(confirmPasswordInput.value).toBe('')
    })
  })
})
