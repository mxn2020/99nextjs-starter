
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OAuthButtons from '@/components/auth/OAuthButtons'

jest.mock('@/server/auth.actions', () => ({
  loginWithOAuth: jest.fn(),
  linkOAuthAccount: jest.fn(),
}))

describe('OAuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render OAuth provider buttons', () => {
    render(<OAuthButtons manualAccountLinking={false} />)
    
    expect(screen.getByText(/continue with github/i)).toBeInTheDocument()
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
  })

  it('should show signup text when isSignUp is true', () => {
    render(<OAuthButtons isSignUp={true} manualAccountLinking={false} />)
    
    expect(screen.getByText(/sign up with github/i)).toBeInTheDocument()
    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument()
  })

  it('should show link text when manualAccountLinking is true', () => {
    render(<OAuthButtons manualAccountLinking={true} />)
    
    expect(screen.getByText(/link github/i)).toBeInTheDocument()
    expect(screen.getByText(/link google/i)).toBeInTheDocument()
  })

  it('should call loginWithOAuth when login button clicked', async () => {
    const authActions = await import('@/server/auth.actions')
    const loginWithOAuth = authActions.loginWithOAuth as jest.Mock
    loginWithOAuth.mockResolvedValue({ success: true })

    render(<OAuthButtons manualAccountLinking={false} />)
    
    const githubButton = screen.getByText(/continue with github/i)
    fireEvent.click(githubButton)
    
    await waitFor(() => {
      expect(loginWithOAuth).toHaveBeenCalledWith('github', undefined)
    })
  })

  it('should call linkOAuthAccount when linking button clicked', async () => {
    const authActions = await import('@/server/auth.actions')
    const linkOAuthAccount = authActions.linkOAuthAccount as jest.Mock
    linkOAuthAccount.mockResolvedValue({ success: true })

    render(<OAuthButtons manualAccountLinking={true} />)
    
    const githubButton = screen.getByText(/link github/i)
    fireEvent.click(githubButton)
    
    await waitFor(() => {
      expect(linkOAuthAccount).toHaveBeenCalledWith('github')
    })
  })

  it('should show loading state when provider is loading', async () => {
    const authActions = await import('@/server/auth.actions')
    const loginWithOAuth = authActions.loginWithOAuth as jest.Mock
    loginWithOAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<OAuthButtons manualAccountLinking={false} />)
    
    const githubButton = screen.getByText(/continue with github/i)
    fireEvent.click(githubButton)
    
    await waitFor(() => {
      expect(screen.getByText(/connecting to github/i)).toBeInTheDocument()
    })
  })

  it('should pass redirectTo parameter', async () => {
    const authActions = await import('@/server/auth.actions')
    const loginWithOAuth = authActions.loginWithOAuth as jest.Mock
    loginWithOAuth.mockResolvedValue({ success: true })

    render(<OAuthButtons manualAccountLinking={false} redirectTo="/dashboard" />)
    
    const githubButton = screen.getByText(/continue with github/i)
    fireEvent.click(githubButton)
    
    await waitFor(() => {
      expect(loginWithOAuth).toHaveBeenCalledWith('github', '/dashboard')
    })
  })
})
