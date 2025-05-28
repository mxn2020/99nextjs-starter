
import { cn, formatBytes, truncateString, formatRelativeTime, debounce } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'excluded')).toBe('base conditional')
    })

    it('should handle tailwind conflicts', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimals', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
    })
  })

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that should be truncated'
      expect(truncateString(longString, 20)).toBe('This is a very long ...')
    })

    it('should return original string if shorter than limit', () => {
      const shortString = 'Short'
      expect(truncateString(shortString, 20)).toBe('Short')
    })

    it('should use default length', () => {
      const longString = 'A'.repeat(60)
      expect(truncateString(longString)).toBe('A'.repeat(50) + '...')
    })
  })

  describe('formatRelativeTime', () => {
    const now = new Date('2023-10-15T10:00:00Z')
    
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(now)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "just now" for recent times', () => {
      const recent = new Date('2023-10-15T09:59:30Z')
      expect(formatRelativeTime(recent)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const minutes = new Date('2023-10-15T09:55:00Z')
      expect(formatRelativeTime(minutes)).toBe('5m ago')
    })

    it('should return hours ago', () => {
      const hours = new Date('2023-10-15T08:00:00Z')
      expect(formatRelativeTime(hours)).toBe('2h ago')
    })

    it('should return days ago', () => {
      const days = new Date('2023-10-13T10:00:00Z')
      expect(formatRelativeTime(days)).toBe('2d ago')
    })

    it('should return formatted date for old dates', () => {
      const old = new Date('2023-08-15T10:00:00Z')
      expect(formatRelativeTime(old)).toBe('8/15/2023')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', () => {
      jest.useFakeTimers()
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn('test')
      debouncedFn('test2')
      debouncedFn('test3')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test3')

      jest.useRealTimers()
    })
  })
})
