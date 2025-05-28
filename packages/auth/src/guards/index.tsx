'use client';

import React, { ComponentType } from 'react';
import { useAuth, hasRole, hasPermission } from '../hooks';
import type { AuthGuardOptions, User } from '../types';

export function withAuthGuard<P extends object>(
  Component: ComponentType<P>,
  options: AuthGuardOptions = {}
): ComponentType<P> {
  const GuardedComponent = (props: P) => {
    const { user, loading } = useAuth();

    if (loading) {
      return options.loading ? <options.loading /> : <DefaultLoadingComponent />;
    }

    if (!user) {
      return options.fallback ? <options.fallback /> : <DefaultFallbackComponent />;
    }

    // Check role requirements
    if (options.requiredRole) {
      const roles = Array.isArray(options.requiredRole) 
        ? options.requiredRole 
        : [options.requiredRole];
      
      const hasRequiredRole = roles.some(role => hasRole(user, role));
      if (!hasRequiredRole) {
        return <UnauthorizedComponent requiredRole={options.requiredRole} />;
      }
    }

    // Check permission requirements
    if (options.requiredPermissions) {
      const permissions = Array.isArray(options.requiredPermissions) 
        ? options.requiredPermissions 
        : [options.requiredPermissions];
      
      const hasRequiredPermission = permissions.some(permission => 
        hasPermission(user, permission)
      );
      
      if (!hasRequiredPermission) {
        return <UnauthorizedComponent requiredPermissions={options.requiredPermissions} />;
      }
    }

    return <Component {...props} />;
  };

  GuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return GuardedComponent;
}

export function AuthGuard({ 
  children, 
  fallback, 
  loading,
  requiredRole,
  requiredPermissions 
}: AuthGuardOptions & { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return loading ? React.createElement(loading) : <DefaultLoadingComponent />;
  }

  if (!user) {
    return fallback ? React.createElement(fallback) : <DefaultFallbackComponent />;
  }

  // Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(user, role));
    
    if (!hasRequiredRole) {
      return <UnauthorizedComponent requiredRole={requiredRole} />;
    }
  }

  // Check permission requirements
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(user, permission)
    );
    
    if (!hasRequiredPermission) {
      return <UnauthorizedComponent requiredPermissions={requiredPermissions} />;
    }
  }

  return <>{children}</>;
}

export function RoleGuard({ 
  children, 
  role, 
  fallback 
}: { 
  children: React.ReactNode; 
  role: string | string[];
  fallback?: ComponentType;
}) {
  const { user } = useAuth();

  if (!user) {
    return fallback ? React.createElement(fallback) : <DefaultFallbackComponent />;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasRequiredRole = roles.some(r => hasRole(user, r));

  if (!hasRequiredRole) {
    return fallback ? React.createElement(fallback) : <UnauthorizedComponent requiredRole={role} />;
  }

  return <>{children}</>;
}

export function PermissionGuard({ 
  children, 
  permission, 
  fallback 
}: { 
  children: React.ReactNode; 
  permission: string | string[];
  fallback?: ComponentType;
}) {
  const { user } = useAuth();

  if (!user) {
    return fallback ? React.createElement(fallback) : <DefaultFallbackComponent />;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasRequiredPermission = permissions.some(p => hasPermission(user, p));

  if (!hasRequiredPermission) {
    return fallback ? React.createElement(fallback) : <UnauthorizedComponent requiredPermissions={permission} />;
  }

  return <>{children}</>;
}

// Default components
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

function DefaultFallbackComponent() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please sign in to access this content.</p>
      </div>
    </div>
  );
}

function UnauthorizedComponent({ 
  requiredRole, 
  requiredPermissions 
}: { 
  requiredRole?: string | string[];
  requiredPermissions?: string | string[];
}) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You don't have the required {requiredRole ? 'role' : 'permissions'} to access this content.
        </p>
        {requiredRole && (
          <p className="text-sm text-gray-500 mt-2">
            Required role: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
          </p>
        )}
        {requiredPermissions && (
          <p className="text-sm text-gray-500 mt-2">
            Required permissions: {Array.isArray(requiredPermissions) ? requiredPermissions.join(', ') : requiredPermissions}
          </p>
        )}
      </div>
    </div>
  );
}
