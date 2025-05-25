
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupForm from '@/components/auth/SignupForm'

jest.mock('@/server/auth.actions', () => ({
  signupWithPassword: jest.fn(),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render signup form fields', () => {
    render(<SignupForm />)
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should require all form fields', () => {
    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(confirmPasswordInput).toBeRequired()
  })

  it('should display success message when email confirmation required', async () => {
    const { signupWithPassword } = require('@/server/auth.actions')
    signupWithPassword.mockReturnValue(Promise.resolve({
      message: 'Please check your email to verify your account.',
      success: true,
      requiresConfirmation: true
    }))

    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      expect(screen.getByText('Please check your email to verify your account.')).toBeInTheDocument()
    })
  })

  it('should display error message when signup fails', async () => {
    const { signupWithPassword } = require('@/server/auth.actions')
    signupWithPassword.mockReturnValue(Promise.resolve({
      message: 'Email already exists',
      success: false,
      errors: null
    }))

    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should show field errors when validation fails', async () => {
    const { signupWithPassword } = require('@/server/auth.actions')
    signupWithPassword.mockReturnValue(Promise.resolve({
      message: 'Validation failed',
      success: false,
      errors: {
        email: ['Invalid email address'],
        password: ['Password too short'],
        confirmPassword: ['Passwords do not match']
      }
    }))

    render(<SignupForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password too short')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should include redirectTo in form data when provided', () => {
    render(<SignupForm redirectTo="/onboarding" />)
    
    const hiddenInput = document.querySelector('input[name="redirectTo"]')
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput).toHaveValue('/onboarding')
  })
})
