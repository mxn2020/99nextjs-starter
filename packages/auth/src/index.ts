// Main exports
export * from './types';
export * from './errors';
export { AuthError } from './errors'; // Explicitly use AuthError from errors
export * from './hooks';
export * from './providers';
export * from './guards';
export * from './utils';
// Provider-specific exports
export * from './providers/supabase';
export * from './providers/nextauth';
export * from './providers/jwt';
export * from './providers/basic';
export * from './providers/better-auth';
export * from './providers/clerk';
// Component exports
export * from './components';
// Utility exports
export { createAuthMiddleware } from './middleware';
export { withAuth, createAuthHandler } from './api';
// export { createMockAuth } from './testing';
