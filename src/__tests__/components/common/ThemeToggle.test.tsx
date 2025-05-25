
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useTheme } from 'next-themes'

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    mockSetTheme.mockClear()
    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      resolvedTheme: 'light',
    })
  })

  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })
  })

  it('should call setTheme when option selected', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument()
    })
    
    const darkOption = screen.getByText('Dark')
    await user.click(darkOption)
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
