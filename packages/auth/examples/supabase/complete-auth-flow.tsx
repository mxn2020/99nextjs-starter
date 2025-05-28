// Complete authentication flow with Supabase
// This example demonstrates a full-featured authentication system

'use client';

import { SupabaseAuthProvider, useAuth } from 'packages/auth/src';
import React, { useState } from 'react';

// Main application with complete auth flow
export default function CompleteAuthApp() {
  return (
    <SupabaseAuthProvider
      config={{
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        redirects: {
          signIn: '/auth/signin',
          signUp: '/auth/signup',
          signOut: '/',
          afterSignIn: '/dashboard',
          afterSignUp: '/onboarding',
        },
      }}
    >
      <AuthFlow />
    </SupabaseAuthProvider>
  );
}

function AuthFlow() {
  const { user, loading, error } = useAuth();
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'forgot-password'>('signin');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (user) {
    return <UserDashboard user={user} />;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Authentication Demo</h1>
        <p>Complete authentication flow with Supabase</p>
      </div>

      <AuthTabs currentView={currentView} setCurrentView={setCurrentView} />

      {currentView === 'signin' && <SignInForm setCurrentView={setCurrentView} />}
      {currentView === 'signup' && <SignUpForm setCurrentView={setCurrentView} />}
      {currentView === 'forgot-password' && <ForgotPasswordForm setCurrentView={setCurrentView} />}
    </div>
  );
}

// Tab navigation for auth forms
function AuthTabs({ 
  currentView, 
  setCurrentView 
}: {
  currentView: string;
  setCurrentView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}) {
  const tabStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: isActive ? '#3b82f6' : '#f3f4f6',
    color: isActive ? 'white' : '#374151',
    cursor: 'pointer',
    borderRadius: '5px 5px 0 0',
    marginRight: '5px',
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        style={tabStyle(currentView === 'signin')}
        onClick={() => setCurrentView('signin')}
      >
        Sign In
      </button>
      <button
        style={tabStyle(currentView === 'signup')}
        onClick={() => setCurrentView('signup')}
      >
        Sign Up
      </button>
    </div>
  );
}

// Enhanced sign in form with OAuth
function SignInForm({ setCurrentView }: { setCurrentView: (view: any) => void }) {
  const { signIn, signInWithOAuth, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn(formData);
    if (result.error) {
      setError(result.error.message);
    }
  };

  const handleOAuth = async (provider: string) => {
    setError('');
    const result = await signInWithOAuth({
      provider,
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    
    if (result.error) {
      setError(result.error.message);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '0 5px 5px 5px' }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="Enter your email"
          required
        />

        <FormField
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Enter your password"
          required
        />

        {error && <ErrorMessage message={error} />}

        <SubmitButton loading={loading} text="Sign In" />
      </form>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <span style={{ color: '#6b7280' }}>or</span>
      </div>

      <OAuthButtons onOAuth={handleOAuth} loading={loading} />

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={() => setCurrentView('forgot-password')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Forgot your password?
        </button>
      </div>
    </div>
  );
}

// Enhanced sign up form
function SignUpForm({ setCurrentView }: { setCurrentView: (view: any) => void }) {
  const { signUp, signInWithOAuth, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });

    if (result.error) {
      setError(result.error.message);
    } else if (result.needsVerification) {
      setSuccess(true);
    }
  };

  const handleOAuth = async (provider: string) => {
    const result = await signInWithOAuth({
      provider,
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    
    if (result.error) {
      setError(result.error.message);
    }
  };

  if (success) {
    return (
      <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '0 5px 5px 5px', textAlign: 'center' }}>
        <h3 style={{ color: '#059669', marginBottom: '10px' }}>Check Your Email!</h3>
        <p style={{ marginBottom: '20px' }}>
          We've sent you a verification email at <strong>{formData.email}</strong>.
          Please click the link in the email to activate your account.
        </p>
        <button
          onClick={() => setCurrentView('signin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '0 5px 5px 5px' }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <FormField
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="Enter your full name"
          required
        />

        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="Enter your email"
          required
        />

        <FormField
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Create a password"
          required
        />

        <FormField
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          placeholder="Confirm your password"
          required
        />

        {error && <ErrorMessage message={error} />}

        <SubmitButton loading={loading} text="Sign Up" />
      </form>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <span style={{ color: '#6b7280' }}>or</span>
      </div>

      <OAuthButtons onOAuth={handleOAuth} loading={loading} />
    </div>
  );
}

// Forgot password form
function ForgotPasswordForm({ setCurrentView }: { setCurrentView: (view: any) => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '0 5px 5px 5px', textAlign: 'center' }}>
        <h3 style={{ color: '#059669', marginBottom: '10px' }}>Reset Email Sent!</h3>
        <p style={{ marginBottom: '20px' }}>
          Check your email for password reset instructions.
        </p>
        <button
          onClick={() => setCurrentView('signin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '0 5px 5px 5px' }}>
      <h3 style={{ marginBottom: '15px' }}>Reset Password</h3>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          required
        />

        {error && <ErrorMessage message={error} />}

        <SubmitButton loading={loading} text="Send Reset Email" />
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={() => setCurrentView('signin')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}

// User dashboard after authentication
function UserDashboard({ user }: { user: any }) {
  const { signOut, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      await updateUser({ name });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Welcome to Your Dashboard!</h1>
        <button
          onClick={signOut}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Profile Information</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Email:</strong> {user.email}
          {user.emailVerified ? (
            <span style={{ color: '#059669', marginLeft: '10px' }}>✓ Verified</span>
          ) : (
            <span style={{ color: '#dc2626', marginLeft: '10px' }}>⚠ Not verified</span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Name:</strong>
          {isEditing ? (
            <div style={{ marginTop: '5px' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginRight: '10px',
                }}
              />
              <button
                onClick={handleUpdateProfile}
                disabled={updating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '5px',
                }}
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <span>
              {user.name || 'Not provided'}
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Edit
              </button>
            </span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>User ID:</strong> {user.id}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Roles:</strong> {user.roles?.join(', ') || 'None'}
        </div>

        <div>
          <strong>Member since:</strong> {user.createdAt?.toLocaleDateString() || 'Unknown'}
        </div>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>🎉 Authentication Complete!</h3>
        <p style={{ margin: 0, color: '#92400e' }}>
          You've successfully authenticated with Supabase. This dashboard demonstrates 
          user profile management, session handling, and secure authentication state.
        </p>
      </div>
    </div>
  );
}

// Reusable components
function FormField({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        {label}:
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #d1d5db',
          borderRadius: '5px',
          fontSize: '16px',
        }}
      />
    </div>
  );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: loading ? '#9ca3af' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
    >
      {loading ? 'Processing...' : text}
    </button>
  );
}

function OAuthButtons({ onOAuth, loading }: { onOAuth: (provider: string) => void; loading: boolean }) {
  const buttonStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => onOAuth('google')}
        disabled={loading}
        style={buttonStyle}
      >
        <span>🌐</span> Continue with Google
      </button>
      
      <button
        type="button"
        onClick={() => onOAuth('github')}
        disabled={loading}
        style={buttonStyle}
      >
        <span>⚡</span> Continue with GitHub
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '15px',
      fontSize: '14px',
    }}>
      {message}
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '50px auto', 
      padding: '20px',
      textAlign: 'center',
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
    }}>
      <h2>Authentication Error</h2>
      <p>{error}</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p>Loading authentication...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
