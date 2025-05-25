
import { render } from '@testing-library/react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    const { container } = render(<LoadingSpinner />)
    
    const spinner = container.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6')
  })

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    
    const spinner = container.querySelector('svg')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    
    const spinner = container.querySelector('svg')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="text-blue-500" />)
    
    const spinner = container.querySelector('svg')
    expect(spinner).toHaveClass('text-blue-500')
  })
})
