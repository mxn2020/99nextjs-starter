import type { User } from '@/lib/types'

/**
 * Check if a user has a specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null
}
