# Supabase Authentication Guide

This guide provides comprehensive documentation for using Supabase authentication with the `@99packages/auth` package.

## 🚀 Getting Started

### Prerequisites

- Supabase project with authentication enabled
- Next.js 13+ application
- React 18+

### Installation

```bash
npm install @99packages/auth @supabase/supabase-js @supabase/ssr
```

### Environment Setup

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔧 Configuration

### Basic Configuration

```tsx
// app/layout.tsx
import { SupabaseAuthProvider } from '@99packages/auth/supabase';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
```

### Advanced Configuration

```tsx
import { SupabaseAuthProvider } from '@99packages/auth/supabase';
import type { SupabaseAuthOptions } from '@99packages/auth/supabase';

const authConfig: SupabaseAuthOptions = {
  // Supabase credentials
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Authentication flow
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce', // or 'implicit'
  
  // Custom storage (optional)
  storage: window?.localStorage,
  storageKey: 'sb-auth-token',
  
  // Redirect configuration
  redirects: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: '/',
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
    error: '/auth/error',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider config={authConfig}>
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
```

## 🎣 Authentication Hooks

### useAuth Hook

The primary hook for authentication operations:

```tsx
'use client';

import { useAuth } from '@99packages/auth';

export function AuthExample() {
  const {
    user,           // Current user object
    loading,        // Loading state
    error,          // Error message
    signIn,         // Sign in function
    signUp,         // Sign up function
    signOut,        // Sign out function
    signInWithOAuth,// OAuth sign in
    resetPassword,  // Password reset
    updateUser,     // Update user profile
    refreshToken,   // Refresh session
  } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {user ? (
        <UserProfile user={user} onSignOut={signOut} />
      ) : (
        <SignInForm onSignIn={signIn} onSignUp={signUp} />
      )}
    </div>
  );
}
```

### Specialized Hooks

```tsx
import { 
  useUser, 
  useAuthState, 
  useIsAuthenticated 
} from '@99packages/auth';

function ProfilePage() {
  // Get just the user
  const user = useUser();
  
  // Get authentication state
  const { user: stateUser, loading, error } = useAuthState();
  
  // Get boolean authentication status
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <div>
      <h1>Profile</h1>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name || user?.email}!</p>
          <p>Email verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        <p>Please sign in to view your profile</p>
      )}
    </div>
  );
}
```

## 🔐 Authentication Methods

### Email/Password Authentication

```tsx
import { useAuth } from '@99packages/auth';

function SignInForm() {
  const { signIn, signUp, loading, error } = useAuth();

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn({ email, password });
    
    if (result.error) {
      console.error('Sign in failed:', result.error.message);
    } else {
      console.log('Signed in successfully:', result.user);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    const result = await signUp({ 
      email, 
      password,
      name,
      metadata: {
        preferences: { theme: 'light' }
      }
    });
    
    if (result.error) {
      console.error('Sign up failed:', result.error.message);
    } else if (result.needsVerification) {
      console.log('Please check your email for verification');
    } else {
      console.log('Signed up successfully:', result.user);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSignIn(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### OAuth Authentication

```tsx
import { useAuth } from '@99packages/auth';

function OAuthButtons() {
  const { signInWithOAuth, loading } = useAuth();

  const handleOAuthSignIn = async (provider: string) => {
    const result = await signInWithOAuth({
      provider,
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: ['email', 'profile'], // Optional: specify scopes
    });
    
    if (result.error) {
      console.error('OAuth sign in failed:', result.error.message);
    } else if (result.redirectTo) {
      // Will redirect to OAuth provider
      window.location.href = result.redirectTo;
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading}
      >
        Sign in with Google
      </button>
      
      <button 
        onClick={() => handleOAuthSignIn('github')}
        disabled={loading}
      >
        Sign in with GitHub
      </button>
      
      <button 
        onClick={() => handleOAuthSignIn('discord')}
        disabled={loading}
      >
        Sign in with Discord
      </button>
    </div>
  );
}
```

### Magic Link Authentication

```tsx
import { createSupabaseAuth } from '@99packages/auth/supabase';

function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = createSupabaseAuth();
      const supabase = (auth as any).supabase; // Access underlying client
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Magic link error:', error.message);
      } else {
        setSent(true);
      }
    } catch (error) {
      console.error('Magic link failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <p>Check your email for the magic link!</p>;
  }

  return (
    <form onSubmit={handleMagicLink}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  );
}
```

## 👤 User Management

### Profile Updates

```tsx
import { useAuth } from '@99packages/auth';

function ProfileForm() {
  const { user, updateUser, loading } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const updatedUser = await updateUser({
        name,
        metadata: {
          ...user?.metadata,
          lastUpdated: new Date().toISOString(),
        },
      });
      
      console.log('Profile updated:', updatedUser);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdateProfile}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          title="Email cannot be changed here"
        />
      </div>
      
      <button type="submit" disabled={updating || loading}>
        {updating ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

### Password Management

```tsx
import { useAuth } from '@99packages/auth';

function PasswordManager() {
  const { user, resetPassword } = useAuth();
  const [sent, setSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      await resetPassword(user.email);
      setSent(true);
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };

  return (
    <div>
      <h3>Password Management</h3>
      
      {sent ? (
        <p>Password reset email sent to {user?.email}</p>
      ) : (
        <button onClick={handlePasswordReset}>
          Send Password Reset Email
        </button>
      )}
    </div>
  );
}
```

## 🔒 Route Protection

### Middleware Setup

```typescript
// middleware.ts
import { createAuthMiddleware } from '@99packages/auth/middleware';

export const middleware = createAuthMiddleware({
  provider: 'supabase',
  
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
  ],
  
  // Public routes (accessible without auth)
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
  ],
  
  // Routes to ignore completely
  ignoredRoutes: [
    '/api/webhook',
    '/_next',
    '/favicon.ico',
  ],
  
  // Redirect configuration
  redirects: {
    signIn: '/auth/signin',
    afterSignIn: '/dashboard',
    afterSignOut: '/',
  },
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Component-Level Guards

```tsx
import { withAuthGuard } from '@99packages/auth/guards';

// Higher-order component guard
const ProtectedComponent = withAuthGuard(
  () => <div>This content requires authentication</div>,
  {
    fallback: <div>Please sign in to continue</div>,
    requiredRole: 'user',
    requiredPermissions: ['read:content'],
  }
);

// Hook-based guard
function ConditionalContent() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  if (!user.roles.includes('admin')) {
    return <div>Admin access required</div>;
  }
  
  return <div>Admin content</div>;
}
```

## 🔑 Role-Based Access Control

### Setup User Roles

First, set up your Supabase database to support roles:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  roles TEXT[] DEFAULT '{"user"}',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, roles)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    '{"user"}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### Using Roles in Components

```tsx
import { useAuth } from '@99packages/auth';

function hasRole(user: any, role: string): boolean {
  return user?.roles?.includes(role) || false;
}

function hasPermission(user: any, permission: string): boolean {
  return user?.permissions?.includes(permission) || false;
}

function RoleBasedContent() {
  const { user } = useAuth();

  return (
    <div>
      {hasRole(user, 'user') && (
        <div>User content</div>
      )}
      
      {hasRole(user, 'admin') && (
        <div>Admin content</div>
      )}
      
      {hasRole(user, 'moderator') && (
        <div>Moderator content</div>
      )}
      
      {hasPermission(user, 'posts:create') && (
        <button>Create Post</button>
      )}
      
      {hasPermission(user, 'posts:delete') && (
        <button>Delete Post</button>
      )}
    </div>
  );
}
```

## 🌐 Server-Side Authentication

### App Router (Next.js 13+)

```typescript
// app/dashboard/page.tsx
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/signin');
  }
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
    </div>
  );
}
```

### API Routes

```typescript
// app/api/profile/route.ts
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return NextResponse.json({ user, profile });
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const updates = await request.json();
  
  // Update user profile
  const { data, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }
  
  return NextResponse.json({ profile: data });
}
```

## 🔄 Auth Callback Handling

### OAuth Callback Page

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseAuth } from '@99packages/auth/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const auth = createSupabaseAuth();
      const supabase = (auth as any).supabase;
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error.message);
        router.push('/auth/signin?error=callback_error');
      } else if (data.session) {
        router.push('/dashboard');
      } else {
        router.push('/auth/signin');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
}
```

## 🧪 Testing

### Mock Authentication for Tests

```typescript
// __tests__/auth.test.tsx
import { render, screen } from '@testing-library/react';
import { createMockAuth } from '@99packages/auth/testing';
import { AuthProvider } from '@99packages/auth';
import MyComponent from '../MyComponent';

const mockAuth = createMockAuth({
  user: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    roles: ['user'],
    permissions: ['read:posts'],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  loading: false,
  error: null,
});

test('renders user content when authenticated', () => {
  render(
    <AuthProvider value={mockAuth}>
      <MyComponent />
    </AuthProvider>
  );
  
  expect(screen.getByText('Test User')).toBeInTheDocument();
});
```

### Testing with Different Auth States

```typescript
import { createMockAuth } from '@99packages/auth/testing';

// Unauthenticated state
const unauthenticatedMock = createMockAuth({
  user: null,
  loading: false,
  error: null,
});

// Loading state
const loadingMock = createMockAuth({
  user: null,
  loading: true,
  error: null,
});

// Error state
const errorMock = createMockAuth({
  user: null,
  loading: false,
  error: 'Authentication failed',
});

// Admin user
const adminMock = createMockAuth({
  user: {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true,
    roles: ['admin', 'user'],
    permissions: ['read:all', 'write:all', 'delete:all'],
    metadata: { isAdmin: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. OAuth Redirect Issues

```typescript
// Make sure your OAuth redirect URL is configured correctly
const authConfig = {
  redirects: {
    // Make sure this matches your Supabase OAuth settings
    afterSignIn: '/dashboard', 
  },
};

// In your OAuth callback
signInWithOAuth({
  provider: 'google',
  redirectTo: `${window.location.origin}/auth/callback`, // Full URL required
});
```

#### 2. Session Persistence Issues

```typescript
// Check your Supabase configuration
const authConfig = {
  persistSession: true, // Make sure this is true
  autoRefreshToken: true, // Enable automatic token refresh
  detectSessionInUrl: true, // Required for OAuth flows
};
```

#### 3. RLS Policy Issues

```sql
-- Make sure your RLS policies are correct
-- View current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test policy with specific user
SELECT * FROM profiles WHERE auth.uid() = 'user-id';
```

### Debug Mode

```typescript
// Enable debug logging
const authConfig = {
  debug: process.env.NODE_ENV === 'development',
};
```

## 📖 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [@99packages/database Package Documentation](../database/SUPABASE.md)

## 🤝 Contributing

When contributing to Supabase authentication features:

1. Test with real Supabase projects
2. Ensure SSR compatibility
3. Add proper TypeScript types
4. Include comprehensive examples
5. Update this documentation

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.
