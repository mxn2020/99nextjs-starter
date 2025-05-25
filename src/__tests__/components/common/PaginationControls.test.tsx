
import { render, screen, fireEvent } from '@testing-library/react'
import PaginationControls from '@/components/common/PaginationControls'

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 1,
    totalItems: 100,
    itemsPerPage: 10,
    onPageChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render pagination info', () => {
    render(<PaginationControls {...defaultProps} />)
    
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render navigation buttons', () => {
    render(<PaginationControls {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /first page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last page/i })).toBeInTheDocument()
  })

  it('should disable previous buttons on first page', () => {
    render(<PaginationControls {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /first page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
  })

  it('should disable next buttons on last page', () => {
    render(
      <PaginationControls 
        {...defaultProps} 
        currentPage={10}
      />
    )
    
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /last page/i })).toBeDisabled()
  })

  it('should call onPageChange when buttons clicked', () => {
    const onPageChange = jest.fn()
    render(
      <PaginationControls 
        {...defaultProps} 
        currentPage={5}
        onPageChange={onPageChange}
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /first page/i }))
    expect(onPageChange).toHaveBeenCalledWith(1)
    
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }))
    expect(onPageChange).toHaveBeenCalledWith(4)
    
    fireEvent.click(screen.getByRole('button', { name: /next page/i }))
    expect(onPageChange).toHaveBeenCalledWith(6)
    
    fireEvent.click(screen.getByRole('button', { name: /last page/i }))
    expect(onPageChange).toHaveBeenCalledWith(10)
  })

  it('should not render when total pages is 1 or less', () => {
    const { container } = render(
      <PaginationControls 
        {...defaultProps} 
        totalItems={5}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render items per page selector when enabled', () => {
    const onItemsPerPageChange = jest.fn()
    render(
      <PaginationControls 
        {...defaultProps} 
        showItemsPerPageSelector={true}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    )
    
    expect(screen.getByText('Rows:')).toBeInTheDocument()
  })
})
