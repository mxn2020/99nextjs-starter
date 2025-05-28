
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserNav } from '@/components/layout/UserNav'

jest.mock('@/server/auth.actions', () => ({
  logout: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}))

describe('UserNav', () => {
  const mockUser = {
    email: 'user@example.com',
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    role: 'user'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render user avatar', () => {
    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    expect(avatarButton).toBeInTheDocument()
  })

  it('should show user info when dropdown opened', async () => {
    const user = userEvent.setup()
    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })
  })

  it('should show navigation links in dropdown', async () => {
    const user = userEvent.setup()
    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
      expect(screen.getByText('Log out')).toBeInTheDocument()
    })
  })

  it('should call logout when logout clicked', async () => {
    const user = userEvent.setup()
    const authActions = await import('@/server/auth.actions');
    const logout = authActions.logout as jest.Mock
    logout.mockResolvedValue(undefined)

    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    await waitFor(async () => {
      const logoutButton = screen.getByText('Log out')
      await user.click(logoutButton)
      expect(logout).toHaveBeenCalled()
    })
  })

  it('should generate initials from name', async () => {
    const user = userEvent.setup()
    render(<UserNav user={{ ...mockUser, avatarUrl: null }} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  it('should use email for initials when no name provided', async () => {
    const user = userEvent.setup()
    render(<UserNav user={{ ...mockUser, name: null, avatarUrl: null }} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    await waitFor(() => {
      expect(screen.getByText('U')).toBeInTheDocument()
    })
  })

  it('should show loading state during logout', async () => {
    const user = userEvent.setup()
    const authActions = await import('@/server/auth.actions')
    const logout = authActions.logout as jest.Mock
    
    // Create a promise that we can control
    let resolveLogout: () => void
    const logoutPromise = new Promise<void>((resolve) => {
      resolveLogout = resolve
    })
    
    logout.mockReturnValue(logoutPromise)

    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)
    
    // Wait for dropdown to open and show logout button
    const logoutButton = await screen.findByText('Log out')
    expect(logoutButton).toBeInTheDocument()
    
    // Click logout
    await user.click(logoutButton)
    
    // After clicking, the dropdown might close, but we should be able to open it again
    // and see the loading state
    await user.click(avatarButton)
    
    // Now check for the loading state
    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument()
    })
    
    // Clean up
    await act(async () => {
      resolveLogout!()
    })
  })
})
