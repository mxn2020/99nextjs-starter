
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54391'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3099'
