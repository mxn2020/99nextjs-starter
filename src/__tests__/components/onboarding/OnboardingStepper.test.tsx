
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('OnboardingStepper', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/onboarding/step1')
  })

  it('should render all onboarding steps', () => {
    render(<OnboardingStepper currentStep={1} />)
    
    expect(screen.getByText('Profile Basics')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Customize')).toBeInTheDocument()
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  it('should highlight current step', () => {
    render(<OnboardingStepper currentStep={2} />)
    
    const step2Link = screen.getByText('Preferences').closest('a')
    expect(step2Link).toHaveAttribute('aria-current', 'step')
  })

  it('should show completed steps with check marks', () => {
    const { container } = render(<OnboardingStepper currentStep={3} />)
    
    // Find check icons by looking for SVG elements with specific className
    const checkIcons = container.querySelectorAll('svg.h-5.w-5.text-primary-foreground')
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  it('should disable future steps navigation', () => {
    render(<OnboardingStepper currentStep={1} />)
    
    const step3Link = screen.getByText('Customize').closest('a')
    expect(step3Link).toHaveClass('cursor-not-allowed', 'opacity-60')
  })

  it('should allow navigation to completed steps', () => {
    render(<OnboardingStepper currentStep={3} />)
    
    const step1Link = screen.getByText('Profile Basics').closest('a')
    expect(step1Link).toHaveAttribute('href', '/onboarding/step1')
    expect(step1Link).not.toHaveClass('cursor-not-allowed')
  })

  it('should handle completion state', () => {
    const { container } = render(<OnboardingStepper currentStep={0} />)
    
    // Find check icons by looking for SVG elements with specific className
    const checkIcons = container.querySelectorAll('svg.h-5.w-5.text-primary-foreground')
    expect(checkIcons.length).toBe(4)
  })

  it('should show step descriptions as screen reader text', () => {
    render(<OnboardingStepper currentStep={1} />)
    
    expect(screen.getByText('Profile Basics - Current')).toBeInTheDocument()
    expect(screen.getByText('Preferences - Upcoming')).toBeInTheDocument()
  })
})
