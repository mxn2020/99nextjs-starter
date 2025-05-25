
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserNav } from '@/components/layout/UserNav'

jest.mock('@/server/auth.actions', () => ({
  logout: jest.fn(),
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

  it('should show user info when dropdown opened', () => {
    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('should show navigation links in dropdown', () => {
    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })

  it('should call logout when logout clicked', async () => {
    const { logout } = require('@/server/auth.actions')
    logout.mockResolvedValue(undefined)

    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    const logoutButton = screen.getByText('Log out')
    fireEvent.click(logoutButton)
    
    await waitFor(() => {
      expect(logout).toHaveBeenCalled()
    })
  })

  it('should generate initials from name', () => {
    render(<UserNav user={{ ...mockUser, avatarUrl: null }} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should use email for initials when no name provided', () => {
    render(<UserNav user={{ ...mockUser, name: null, avatarUrl: null }} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('should show loading state during logout', async () => {
    const { logout } = require('@/server/auth.actions')
    logout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<UserNav user={mockUser} />)
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    const logoutButton = screen.getByText('Log out')
    fireEvent.click(logoutButton)
    
    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument()
    })
  })
})
