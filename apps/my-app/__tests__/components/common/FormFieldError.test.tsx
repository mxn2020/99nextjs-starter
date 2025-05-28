
import { render, screen } from '@testing-library/react'
import { FormFieldError } from '@/components/common/FormFieldError'

describe('FormFieldError', () => {
  it('should render error message', () => {
    render(<FormFieldError message="This field is required" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should not render when no message provided', () => {
    const { container } = render(<FormFieldError />)
    
    expect(container.firstChild).toBeNull()
  })

  it('should apply custom className', () => {
    render(<FormFieldError message="Error" className="custom-class" />)
    
    const errorElement = screen.getByText('Error').parentElement
    expect(errorElement).toHaveClass('custom-class')
  })
})
