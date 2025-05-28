// Basic Supabase authentication setup
// This example shows the minimal setup required for Supabase authentication

'use client';

import React from 'react';
import { SupabaseAuthProvider, useAuth } from '@99packages/auth/supabase';

// Environment configuration (add to .env.local)
/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
*/

// Main App Component
export default function App() {
  return (
    <SupabaseAuthProvider>
      <AuthExample />
    </SupabaseAuthProvider>
  );
}

// Authentication component
function AuthExample() {
  const { user, loading, error, signIn, signOut } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Authentication Error: {error}</p>
      </div>
    );
  }

  // Authenticated user
  if (user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Welcome!</h1>
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name || 'Not provided'}</p>
          <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
        
        <button
          onClick={signOut}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Not authenticated - show sign in form
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Sign In</h1>
      <SignInForm />
    </div>
  );
}

// Simple sign in form
function SignInForm() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn({ email, password });
      
      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
          Email:
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
          Password:
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <div style={{ color: 'red', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// Layout wrapper for Next.js App Router
// Add this to your app/layout.tsx
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider>
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
