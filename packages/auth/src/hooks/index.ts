'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../providers/auth-context';
import type {
    AuthHookResult,
    User,
    AuthState,
    SignInOptions,
    SignUpOptions,
    OAuthSignInOptions
} from '../types';
export function useAuth(): AuthHookResult {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function useUser(): User | null {
    const { user } = useAuth();
    return user;
}
export function useAuthState(): AuthState {
    const { user, loading, error } = useAuth();
    return { user, loading, error };
}
export function useIsAuthenticated(): boolean {
    const { user, loading } = useAuth();
    return !loading && !!user;
}

// Hook-based guards
export function useRequireAuth(): User {
  const { user, loading } = useAuth();
  
  if (loading) {
    throw new Promise(() => {}); // Suspend component
  }
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export function useRequireRole(role: string | string[]): User {
  const user = useRequireAuth();
  const roles = Array.isArray(role) ? role : [role];
  
  const hasRequiredRole = roles.some(r => hasRole(user, r));
  
  if (!hasRequiredRole) {
    throw new Error(`Required role not found: ${roles.join(', ')}`);
  }
  
  return user;
}

export function useRequirePermission(permission: string | string[]): User {
  const user = useRequireAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  const hasRequiredPermission = permissions.some(p => hasPermission(user, p));
  
  if (!hasRequiredPermission) {
    throw new Error(`Required permission not found: ${permissions.join(', ')}`);
  }
  
  return user;
}

// Role and permission hooks
export function useHasRole(role: string | string[]): boolean {
    const { user } = useAuth();
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles!.includes(r));
}
export function useHasPermission(permission: string | string[]): boolean {
    const { user } = useAuth();
    if (!user?.permissions) return false;
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(p => user.permissions!.includes(p));
}
export function useHasAnyRole(roles: string[]): boolean {
    const { user } = useAuth();
    if (!user?.roles) return false;
    return roles.some(role => user.roles!.includes(role));
}
export function useHasAllRoles(roles: string[]): boolean {
    const { user } = useAuth();
    if (!user?.roles) return false;
    return roles.every(role => user.roles!.includes(role));
}
export function useHasAnyPermission(permissions: string[]): boolean {
    const { user } = useAuth();
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
}
export function useHasAllPermissions(permissions: string[]): boolean {
    const { user } = useAuth();
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions!.includes(permission));
}
// Session management hooks
export function useAuthSession() {
    const [session, setSession] = useState(null);
    const { user } = useAuth();
    useEffect(() => {
        // TODO: Implement session fetching logic
        // This would depend on the auth provider
    }, [user]);
    return session;
}
// Utility functions that can be used outside of React components
export function hasRole(user: User | null, role: string | string[]): boolean {
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles!.includes(r));
}
export function hasPermission(user: User | null, permission: string | string[]): boolean {
    if (!user?.permissions) return false;
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(p => user.permissions!.includes(p));
}
export function hasAnyRole(user: User | null, roles: string[]): boolean {
    if (!user?.roles) return false;
    return roles.some(role => user.roles!.includes(role));
}
export function hasAllRoles(user: User | null, roles: string[]): boolean {
    if (!user?.roles) return false;
    return roles.every(role => user.roles!.includes(role));
}
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
}
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions!.includes(permission));
}
