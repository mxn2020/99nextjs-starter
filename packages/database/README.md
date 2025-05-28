# @99packages/database

A modular database package designed for monorepos, providing flexible, type-safe clients for multiple database systems including Supabase, Prisma, Redis, and more.

## Features

- 🔒 **Type-safe** - Full TypeScript support with your database schemas
- 🌳 **Tree-shakable** - Import only what you need
- 🏢 **Monorepo-friendly** - Each app can have its own database configuration
- ⚡ **Multiple adapters** - Supabase, Prisma, Redis, Neon, MongoDB, and more
- 🔧 **Flexible configuration** - Environment variables or direct credential passing

## Database Systems

- **[Supabase](./SUPABASE.md)** - PostgreSQL with real-time subscriptions and auth
- **Prisma** - Type-safe database client and ORM
- **Redis** - In-memory data store for caching
- **Upstash** - Serverless Redis
- **Neon** - Serverless PostgreSQL
- **MongoDB** - Document database

## Quick Start

```bash
npm install @99packages/database
```

## Usage Examples

### Using only what you need:

```typescript
// app/api/user/route.ts
import { prisma } from '@99packages/database/prisma';

export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users);
}
```

```typescript
// app/api/cache/route.ts
import { upstashRedis } from '@99packages/database/upstash/redis';

export async function GET(request: Request) {
  const cached = await upstashRedis.get('my-key');
  if (cached) {
    return Response.json({ cached: true, data: cached });
  }
  // ... fetch and cache
}
```

```typescript
// app/auth/page.tsx
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase'; // Your app's generated types

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient<Database>();
  const { data: { user } } = await supabase.auth.getUser();
  
  return <div>Welcome {user?.email}</div>;
}
```

> 📖 **For complete Supabase documentation**, see [SUPABASE.md](./SUPABASE.md) for detailed API reference, examples, and best practices.
```

```typescript
// middleware.ts
import { createSupabaseMiddlewareClient } from '@99packages/database/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase'; // Your app's generated types

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient<Database>(request);
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

### Additional Usage Examples

```typescript
// Using with custom credentials
import { createSupabaseBrowserClient } from '@99packages/database/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createSupabaseBrowserClient<Database>(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

```typescript
// Admin client usage
import { createSupabaseAdminClient } from '@99packages/database/supabase/admin';
import type { Database } from '@/types/supabase';

const adminClient = createSupabaseAdminClient<Database>(
  'https://your-project.supabase.co',
  'your-service-role-key'
);

// Perform admin operations
const { data: users } = await adminClient
  .from('users')
  .select('*')
  .limit(100);
```

### Type Safety

Each Supabase client accepts a generic `TDatabase` type parameter:
- If no type is provided, it defaults to `DefaultDatabase` (a generic fallback)
- Pass your app's generated Database types for full type safety
- Generate types using: `npx supabase gen types typescript --project-id "your-project-id"`
```

This modular approach means:
- Developers only import what they need
- Tree-shaking removes unused code
- Each database system is completely independent
- You can use your existing Supabase setup with multiple client types
- **Full type safety with your app's Database types**
- **Flexible configuration - use environment variables or pass credentials directly**
- **Each app in the monorepo can have its own database schema and types**
- Clear separation of concerns

### Environment Variables

The package will automatically use these environment variables if no credentials are passed:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Types Setup

1. Generate your Supabase types in each app:
```bash
npx supabase gen types typescript --project-id "your-project-id" > types/supabase.ts
```

2. Use them with the clients:
```typescript
import type { Database } from '@/types/supabase';
import { createSupabaseServerClient } from '@99packages/database/supabase/server';

const supabase = await createSupabaseServerClient<Database>();
```
