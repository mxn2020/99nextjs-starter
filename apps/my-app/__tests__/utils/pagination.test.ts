
import { getPaginationMeta, ITEMS_PER_PAGE } from '@/lib/pagination'

describe('pagination', () => {
  describe('getPaginationMeta', () => {
    it('should calculate pagination meta correctly', () => {
      const meta = getPaginationMeta(100, 1, 10)
      
      expect(meta).toEqual({
        currentPage: 1,
        totalPages: 10,
        totalItems: 100,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    })

    it('should handle middle page', () => {
      const meta = getPaginationMeta(100, 5, 10)
      
      expect(meta).toEqual({
        currentPage: 5,
        totalPages: 10,
        totalItems: 100,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      })
    })

    it('should handle last page', () => {
      const meta = getPaginationMeta(100, 10, 10)
      
      expect(meta).toEqual({
        currentPage: 10,
        totalPages: 10,
        totalItems: 100,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      })
    })

    it('should use default items per page', () => {
      const meta = getPaginationMeta(100, 1)
      
      expect(meta.itemsPerPage).toBe(ITEMS_PER_PAGE)
      expect(meta.totalPages).toBe(Math.ceil(100 / ITEMS_PER_PAGE))
    })

    it('should handle edge case with 0 items', () => {
      const meta = getPaginationMeta(0, 1, 10)
      
      expect(meta).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })
  })
})
