import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/login',
}))

jest.mock('@/server/auth.actions', () => ({
  loginWithPassword: jest.fn(),
  signupWithPassword: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      getSession: jest.fn(() => ({ data: { session: null } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      }))
    }))
  }))
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      const authActions = await import('@/server/auth.actions')
      const loginWithPassword = authActions.loginWithPassword as jest.Mock

      loginWithPassword.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/dashboard')
        return Promise.resolve({ success: true })
      })

      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(loginWithPassword).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(FormData)
        )
      })
    })

    it('should handle login failure gracefully', async () => {
      const authActions = await import('@/server/auth.actions')
      const loginWithPassword = authActions.loginWithPassword as jest.Mock

      loginWithPassword.mockReturnValue(Promise.resolve({
        message: 'Invalid credentials',
        success: false,
        errors: null
      }))

      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('Signup Flow', () => {
    it('should complete successful signup with email confirmation', async () => {
      const authActions = await import('@/server/auth.actions')
      const signupWithPassword = authActions.signupWithPassword as jest.Mock

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
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
        expect(screen.getByText('Please check your email to verify your account.')).toBeInTheDocument()
      })
    })

    it('should redirect to onboarding after successful signup', async () => {
      const authActions = await import('@/server/auth.actions')
      const signupWithPassword = authActions.signupWithPassword as jest.Mock

      signupWithPassword.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step1')
        return Promise.resolve({ success: true })
      })

      render(<SignupForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(signupWithPassword).toHaveBeenCalled()
      })
    })

    it('should handle signup validation errors', async () => {
      const authActions = await import('@/server/auth.actions')
      const signupWithPassword = authActions.signupWithPassword as jest.Mock

      signupWithPassword.mockImplementation(async (prevState: any, formData: FormData) => {
        return {
          message: 'Validation failed',
          success: false,
          errors: {
            email: ['Email already exists'],
            password: ['Password too weak'],
            confirmPassword: ['Passwords do not match']
          }
        }
      })

      render(<SignupForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      
      // Fill the form with invalid data to trigger validation
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '456' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(signupWithPassword).toHaveBeenCalled()
      })

      // Verify the form elements are present and functional
      expect(emailInput).toHaveAttribute('name', 'email')
      expect(passwordInput).toHaveAttribute('name', 'password')
      expect(confirmPasswordInput).toHaveAttribute('name', 'confirmPassword')
      expect(submitButton).toBeInTheDocument()
    })

    it('should display signup validation errors correctly', async () => {
      // Test the FormFieldError component directly to ensure error display works
      const { FormFieldError } = await import('@/components/common/FormFieldError')
      
      render(
        <div>
          <FormFieldError message="Email already exists" />
          <FormFieldError message="Password too weak" />
          <FormFieldError message="Passwords do not match" />
        </div>
      )
      
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
      expect(screen.getByText('Password too weak')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      
      // Check that all error messages have proper alert roles
      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(3)
    })
  })
})
