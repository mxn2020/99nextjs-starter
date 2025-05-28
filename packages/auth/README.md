# @99packages/auth

A comprehensive authentication package for Next.js applications with built-in support for multiple authentication providers including **Supabase**, NextAuth.js, JWT, Basic Auth, Better Auth, and Clerk.

## 📋 Table of Contents

- [Features](#-features)
- [Documentation](#-documentation)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Provider Examples](#provider-specific-examples)
  - [Supabase Auth](#supabase-auth)
  - [NextAuth.js](#nextauthjs)
  - [Custom JWT](#custom-jwt)
  - [Better Auth](#better-auth)
  - [Clerk](#clerk)
- [API Routes](#api-routes)
- [Utilities](#utilities)
- [Type Safety](#type-safety)
- [Migration Guide](#migration-guide)
- [Testing](#testing)
- [Contributing](#contributing)

## 🚀 Features

### Core Authentication Features
- **Multiple Provider Support**: Supabase, NextAuth.js, JWT, Basic Auth, Better Auth, Clerk
- **Type-Safe API**: Full TypeScript support with comprehensive type definitions
- **React Hooks**: Easy-to-use hooks for authentication state management
- **Middleware Protection**: Route-based authentication and authorization
- **Error Handling**: Structured error handling with detailed error codes
- **Session Management**: Automatic session handling and token refresh
- **OAuth Integration**: Social login support for multiple providers

### Supabase-Specific Features
- **Supabase Auth Integration**: Native Supabase authentication with full feature support
- **Email/Password Authentication**: Traditional sign-in and sign-up flows
- **OAuth Providers**: Google, GitHub, Discord, and more social login options
- **Email Verification**: Built-in email confirmation workflows
- **Password Reset**: Secure password reset functionality
- **User Profile Management**: Update user information and metadata
- **Role-Based Access Control**: Support for user roles and permissions
- **Real-time Auth State**: Live authentication state updates
- **SSR Support**: Server-side rendering compatibility with `@supabase/ssr`

## 📚 Documentation

### Provider-Specific Guides
- **[Supabase Authentication Guide](./SUPABASE.md)** - Comprehensive guide for Supabase authentication
- **[Examples Directory](./examples/README.md)** - Production-ready code examples

### Quick Links
- [Supabase Examples](./examples/supabase/) - Basic setup, complete auth flows, and middleware patterns
- [API Reference](#api-routes) - Protected routes and multi-provider handlers
- [Type Safety](#type-safety) - TypeScript definitions and error handling
- [Migration Guide](#migration-guide) - Migrate from other auth solutions

## 📦 Installation

```bash
npm install @99packages/auth @supabase/supabase-js @supabase/ssr
# or
pnpm add @99packages/auth @supabase/supabase-js @supabase/ssr
# or
yarn add @99packages/auth @supabase/supabase-js @supabase/ssr
```

## 🚀 Quick Start

### For Supabase Users
The fastest way to get started with Supabase authentication:

```bash
# Install dependencies
npm install @99packages/auth @supabase/supabase-js @supabase/ssr

# Set up environment variables
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
```

Check out our [complete Supabase setup guide](./SUPABASE.md) or explore [practical examples](./examples/supabase/) including:
- [Basic Setup](./examples/supabase/basic-setup.tsx) - Get up and running in 5 minutes
- [Complete Auth Flow](./examples/supabase/complete-auth-flow.tsx) - Production-ready authentication system
- [Middleware Configuration](./examples/supabase/middleware-config.ts) - Route protection and role-based access

## 🛠️ Configuration

### Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Basic Setup

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
// app/layout.tsx
import { SupabaseAuthProvider } from '@99packages/auth/supabase';

const authConfig = {
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Auth flow options
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce' as const,
  
  // Redirect URLs
  redirects: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: '/',
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
  },
  
  // Storage options
  storageKey: 'sb-auth-token',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

# Provider-Specific Examples

## Supabase Auth

> **📖 Complete Guide Available:** Check out our [comprehensive Supabase documentation](./SUPABASE.md) for detailed setup instructions, advanced configurations, and production best practices.

### Basic Usage
```typescript
import { createSupabaseAuth } from '@99packages/auth/supabase';

const auth = createSupabaseAuth();

// Email/Password Sign Up
await auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'John Doe',
    },
  },
});

// Email/Password Sign In
await auth.signIn({
  email: 'user@example.com',
  password: 'password123',
});

// OAuth Sign In
await auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Sign Out
await auth.signOut();
```

### 📁 Examples
- **[Basic Setup](./examples/supabase/basic-setup.tsx)** - Minimal authentication setup
- **[Complete Auth Flow](./examples/supabase/complete-auth-flow.tsx)** - Full-featured authentication system
- **[Middleware Config](./examples/supabase/middleware-config.ts)** - Route protection patterns

### NextAuth.js
typescript// app/api/auth/[...nextauth]/route.ts
import { nextAuthConfig } from '@99packages/auth/nextauth';

export const GET = nextAuthConfig.handlers.GET;
export const POST = nextAuthConfig.handlers.POST;
typescript// In components
import { useSession, signIn, signOut } from 'next-auth/react';

export function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn()}>Sign in</button>
  );
}
```

## Custom JWT
```typescript
import { createJWTAuth } from '@99packages/auth/jwt';

const auth = createJWTAuth();

// Sign Up
await auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Sign In
const { user, token } = await auth.signIn({
  email: 'user@example.com',
  password: 'password123',
});

// Verify Token
const user = await auth.verifyToken(token);
Better Auth
typescriptimport { betterAuth } from '@99packages/auth/better-auth';

// Client-side
const { signIn, signOut, user } = betterAuth.useAuthClient();

// Sign in with email/password
await signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in with OAuth
await signIn.social({
  provider: 'google',
});

// Sign out
await signOut();
Clerk
typescript// app/layout.tsx
import { ClerkProvider } from '@99packages/auth/clerk';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
typescript// In components
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';

export function AuthButton() {
  const { isSignedIn, user } = useUser();

  if (isSignedIn) {
    return (
      <div>
        <p>Hello, {user.firstName}!</p>
        <SignOutButton />
      </div>
    );
  }

  return <SignInButton />;
}
```

## API Routes

### Protected API Route Example
```typescript
// app/api/protected/route.ts
import { withAuth } from '@99packages/auth/api';

export const GET = withAuth(async (request, { user }) => {
  return Response.json({ 
    message: `Hello ${user.email}!`,
    user 
  });
});
Custom API Route with Multiple Providers
typescript// app/api/auth/signin/route.ts
import { createAuthHandler } from '@99packages/auth/api';

export const POST = createAuthHandler({
  supabase: async ({ email, password }) => {
    // Supabase sign in logic
  },
  jwt: async ({ email, password }) => {
    // JWT sign in logic
  },
  basic: async ({ username, password }) => {
    // Basic auth logic
  },
});
```

## Utilities

### Role-Based Access Control
```typescript
import { useAuth, hasRole, hasPermission } from '@99packages/auth/hooks';

function AdminPanel() {
  const { user } = useAuth();

  if (!hasRole(user, 'admin')) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}

function EditButton() {
  const { user } = useAuth();

  if (!hasPermission(user, 'posts:edit')) {
    return null;
  }

  return <button>Edit Post</button>;
}
```

### Auth Guards
```typescript
import { withAuthGuard } from '@99packages/auth/guards';

const ProtectedComponent = withAuthGuard(
  () => <div>Protected content</div>,
  {
    fallback: <div>Please sign in</div>,
    requiredRole: 'user',
    requiredPermissions: ['read:posts'],
  }
);
```

## Type Safety

### All authentication providers are fully typed:
```typescript
import type { 
  User, 
  AuthState, 
  SignInOptions, 
  SignUpOptions,
  AuthProvider 
} from '@99packages/auth/types';

// User type is consistent across all providers
const user: User = {
  id: 'user-id',
  email: 'user@example.com',
  name: 'John Doe',
  roles: ['user'],
  permissions: ['read:posts'],
  metadata: {},
};
Error Handling
typescriptimport { AuthError, AuthErrorCode } from '@99packages/auth/errors';

try {
  await auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AuthErrorCode.INVALID_CREDENTIALS:
        // Handle invalid credentials
        break;
      case AuthErrorCode.USER_NOT_FOUND:
        // Handle user not found
        break;
      case AuthErrorCode.EMAIL_NOT_VERIFIED:
        // Handle unverified email
        break;
    }
  }
}
```

## Migration Guide
From Auth0 to Supabase
```typescript
// Before (Auth0)
import { useUser } from '@auth0/nextjs-auth0';

// After (Supabase)
import { useAuth } from '@99packages/auth/hooks';
From Firebase Auth to Custom JWT
typescript// Migration utility
import { migrateFromFirebase } from '@99packages/auth/utils/migration';

await migrateFromFirebase({
  firebaseUsers: users,
  targetProvider: 'jwt',
});
Testing
typescriptimport { createMockAuth } from '@99packages/auth/testing';

const mockAuth = createMockAuth({
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
});

// Use in tests
render(
  <AuthProvider value={mockAuth}>
    <YourComponent />
  </AuthProvider>
);
```

## Contributing
Please read our contributing guide before submitting pull requests.

## License
MIT License - see LICENSE for details.
