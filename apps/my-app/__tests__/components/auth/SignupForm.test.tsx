
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupForm from '@/components/auth/SignupForm'
import { useActionState } from 'react'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
}))

jest.mock('@/server/auth.actions', () => ({
  signupWithPassword: jest.fn(),
}))

describe('SignupForm', () => {
  const mockUseActionState = useActionState as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for useActionState
    mockUseActionState.mockReturnValue([
      { message: '', errors: null, success: false },
      jest.fn(),
      false
    ])
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
    // Mock useActionState to return success with email confirmation
    mockUseActionState.mockReturnValue([
      {
        message: 'Please check your email to verify your account.',
        success: true,
        requiresConfirmation: true,
        errors: null
      },
      jest.fn(),
      false
    ])

    render(<SignupForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      expect(screen.getByText('Please check your email to verify your account.')).toBeInTheDocument()
    })
  })

  it('should display error message when signup fails', async () => {
    // Mock useActionState to return signup failure error  
    mockUseActionState.mockReturnValue([
      {
        message: 'Email already exists',
        success: false,
        errors: null
      },
      jest.fn(),
      false
    ])

    render(<SignupForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Signup Failed')).toBeInTheDocument()
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should show field errors when validation fails', async () => {
    // Mock useActionState to return validation errors
    mockUseActionState.mockReturnValue([
      {
        message: 'Validation failed',
        success: false,
        errors: {
          email: ['Invalid email address'],
          password: ['Password too short'],
          confirmPassword: ['Passwords do not match']
        }
      },
      jest.fn(),
      false
    ])

    render(<SignupForm />)
    
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
