
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '@/components/auth/LoginForm'
import { useActionState } from 'react'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
}))

jest.mock('@/server/auth.actions', () => ({
  loginWithPassword: jest.fn(),
}))

describe('LoginForm', () => {
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
    // Mock useActionState to return login failure error
    mockUseActionState.mockReturnValue([
      {
        message: 'Invalid credentials',
        success: false,
        errors: null
      },
      jest.fn(),
      false
    ])

    render(<LoginForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Login Failed')).toBeInTheDocument()
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
    // Mock useActionState to return validation errors
    mockUseActionState.mockReturnValue([
      {
        message: 'Validation failed',
        success: false,
        errors: {
          email: ['Invalid email address'],
          password: ['Password is required']
        }
      },
      jest.fn(),
      false
    ])

    render(<LoginForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })
})
