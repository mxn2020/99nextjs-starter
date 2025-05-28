# Supabase Authentication Examples

Complete examples for implementing Supabase authentication with `@99packages/auth`.

## 📁 Files in this directory

- `basic-setup.tsx` - Basic Supabase authentication setup
- `complete-auth-flow.tsx` - Complete authentication flow with all features
- `oauth-integration.tsx` - OAuth providers integration
- `protected-routes.tsx` - Route protection examples
- `user-management.tsx` - User profile and management
- `middleware-config.ts` - Middleware configuration
- `server-auth.tsx` - Server-side authentication

## 🚀 Getting Started

1. Set up your Supabase project
2. Configure environment variables
3. Install required dependencies
4. Copy the relevant examples to your project

## 🔧 Prerequisites

```bash
npm install @99packages/auth @supabase/supabase-js @supabase/ssr
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Examples Overview

### Basic Setup
Simple authentication setup with provider and hooks.

### Complete Auth Flow  
Full-featured authentication with sign in, sign up, password reset, and profile management.

### OAuth Integration
Social login with Google, GitHub, and other providers.

### Protected Routes
Middleware and component-level route protection.

### User Management
Profile updates, role management, and permissions.

### Server-Side Auth
Server components and API route authentication.

## 🤝 Usage Tips

- Start with `basic-setup.tsx` for a minimal implementation
- Use `complete-auth-flow.tsx` for production-ready authentication
- Refer to `middleware-config.ts` for route protection
- Check `server-auth.tsx` for SSR patterns

## 🔗 Related Documentation

- [Main Auth README](../README.md)
- [Supabase Guide](../SUPABASE.md)
- [Database Package](../../database/SUPABASE.md)
