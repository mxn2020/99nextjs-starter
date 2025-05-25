
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from '@/components/auth/LoginForm'

jest.mock('@/server/auth.actions', () => ({
  loginWithPassword: jest.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render login form fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should require email and password fields', () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('should display error message when login fails', async () => {
    const { loginWithPassword } = require('@/server/auth.actions')
    loginWithPassword.mockReturnValue(Promise.resolve({
      message: 'Invalid credentials',
      success: false,
      errors: null
    }))

    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should include redirectTo in form data when provided', () => {
    render(<LoginForm redirectTo="/dashboard" />)
    
    const hiddenInput = document.querySelector('input[name="redirectTo"]')
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput).toHaveValue('/dashboard')
  })

  it('should show field errors when validation fails', async () => {
    const { loginWithPassword } = require('@/server/auth.actions')
    loginWithPassword.mockReturnValue(Promise.resolve({
      message: 'Validation failed',
      success: false,
      errors: {
        email: ['Invalid email address'],
        password: ['Password is required']
      }
    }))

    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })
})
