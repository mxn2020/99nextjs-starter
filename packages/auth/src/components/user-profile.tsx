'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks';
import type { User } from '../types';

interface UserProfileProps {
  className?: string;
  onUpdate?: (user: User) => void;
  onError?: (error: string) => void;
}

export function UserProfile({ className, onUpdate, onError }: UserProfileProps) {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  if (!user) {
    return (
      <div className={className}>
        <p>No user data available</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!updateUser) {
      onError?.('User update not supported');
      return;
    }

    setUpdateLoading(true);

    try {
      const updatedUser = await updateUser({
        name: formData.name,
        email: formData.email,
      });
      
      setIsEditing(false);
      onUpdate?.(updatedUser);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {user.avatar && (
        <div className="mb-4 flex justify-center">
          <img
            src={user.avatar}
            alt={user.name || 'User avatar'}
            className="w-20 h-20 rounded-full object-cover"
          />
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={updateLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={updateLoading}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={updateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updateLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{user.name || 'Not provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            {user.emailVerified !== undefined && (
              <p className="text-xs text-gray-500">
                {user.emailVerified ? '✓ Verified' : '✗ Not verified'}
              </p>
            )}
          </div>

          {user.roles && user.roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Roles</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {user.roles.map(role => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.permissions && user.permissions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {user.permissions.map(permission => (
                  <span
                    key={permission}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Member since</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.createdAt.toLocaleDateString()}
              </p>
            </div>
          )}

          {updateUser && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface UserAvatarProps {
  user?: User | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export function UserAvatar({ user, size = 'md', className, showName }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center ${className}`}>
        <span className="text-gray-600">?</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center`}>
          <span className="text-white font-medium">
            {getInitials(user.name)}
          </span>
        </div>
      )}
      {showName && user.name && (
        <span className="text-sm font-medium text-gray-900">{user.name}</span>
      )}
    </div>
  );
}
