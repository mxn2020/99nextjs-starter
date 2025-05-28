import type { User, AuthProviderType } from '../types';
// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
  return emailRegex.test(email);
}
export function validatePassword(password: string, minLength: number = 8): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(`Password must contain at least one uppercase letter`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push(`Password must contain at least one lowercase letter`);
  }
  if (!/\d/.test(password)) {
    errors.push(`Password must contain at least one number`);
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(`Password must contain at least one special character`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
// User utility functions
export function getUserDisplayName(user: User): string {
  return user.name || user.email || user.id;
}
export function getUserInitials(user: User): string {
  const name = user.name || user.email || user.id;
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
export function isUserEmailVerified(user: User): boolean {
  return user.emailVerified === true;
}
// Role and permission utilities
export function userHasRole(user: User, role: string | string[]): boolean {
  if (!user.roles) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.some(r => user.roles!.includes(r));
}
export function userHasPermission(user: User, permission: string | string[]): boolean {
  if (!user.permissions) return false;
  const permissions = Array.isArray(permission) ? permission : [permission];
  return permissions.some(p => user.permissions!.includes(p));
}
export function userHasAnyRole(user: User, roles: string[]): boolean {
  if (!user.roles) return false;
  return roles.some(role => user.roles!.includes(role));
}
export function userHasAllRoles(user: User, roles: string[]): boolean {
  if (!user.roles) return false;
  return roles.every(role => user.roles!.includes(role));
}
export function userHasAnyPermission(user: User, permissions: string[]): boolean {
  if (!user.permissions) return false;
  return permissions.some(permission => user.permissions!.includes(permission));
}
export function userHasAllPermissions(user: User, permissions: string[]): boolean {
  if (!user.permissions) return false;
  return permissions.every(permission => user.permissions!.includes(permission));
}
// Auth provider utilities
export function getProviderDisplayName(provider: AuthProviderType): string {
  switch (provider) {
    case 'supabase': return 'Supabase';
    case 'nextauth': return 'NextAuth.js';
    case 'jwt': return 'Custom JWT';
    case 'basic': return 'Basic Auth';
    case 'better-auth': return 'Better Auth';
    case 'clerk': return 'Clerk';
    default: return provider;
  }
}
export function isProviderConfigured(provider: AuthProviderType): boolean {
  switch (provider) {
    case 'supabase':
      return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    case 'nextauth':
      return !!process.env.NEXTAUTH_SECRET;

    case 'jwt':
      return !!process.env.JWT_SECRET;

    case 'basic':
      return !!process.env.BASIC_AUTH_USERS;

    case 'better-auth':
      return !!process.env.BETTER_AUTH_SECRET;

    case 'clerk':
      return !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    default:
      return false;
  }
}
// Storage utilities
export function getStorageItem(key: string, storage: 'localStorage' | 'sessionStorage' = 'localStorage'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    return storageObj.getItem(key);
  } catch {
    return null;
  }
}
export function setStorageItem(key: string, value: string, storage: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
  if (typeof window === 'undefined') return;
  try {
    const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    storageObj.setItem(key, value);
  } catch {
    // Handle storage errors silently
  }
}
export function removeStorageItem(key: string, storage: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
  if (typeof window === 'undefined') return;
  try {
    const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    storageObj.removeItem(key);
  } catch {
    // Handle storage errors silently
  }
}
// URL utilities
export function getRedirectUrl(fallback: string = '/'): string {
  if (typeof window === 'undefined') return fallback;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirectTo') || fallback;
}
export function createRedirectUrl(path: string, redirectTo?: string): string {
  if (!redirectTo) return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('redirectTo', redirectTo);
  return url.toString();
}
// Session utilities
export function isSessionExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}
export function getTimeUntilExpiry(expiresAt?: Date): number {
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt.getTime() - Date.now());
}
export function formatTimeUntilExpiry(expiresAt?: Date): string {
  const ms = getTimeUntilExpiry(expiresAt);
  if (ms === 0) return 'Expired';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}
// Error handling utilities
export function formatAuthError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return 'An unknown error occurred';
}
export function isNetworkError(error: any): boolean {
  return error?.name === 'NetworkError' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('fetch');
}
// Misc utilities
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}
