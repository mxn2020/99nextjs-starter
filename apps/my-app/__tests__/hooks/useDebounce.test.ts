
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    expect(result.current).toBe('initial')
    
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    rerender({ value: 'first', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(400)
    })
    
    rerender({ value: 'second', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(400)
    })
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('second')
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    )
    
    rerender({ value: 'updated', delay: 100 })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('updated')
  })
})
