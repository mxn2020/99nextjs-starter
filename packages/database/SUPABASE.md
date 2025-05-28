# Supabase Database Package

A flexible, type-safe Supabase client package designed for monorepos where different apps may have different database schemas and configurations.

## Features

- 🔒 **Type-safe** - Full TypeScript support with your generated Database types
- 🏗️ **Flexible** - Use environment variables or pass credentials directly
- 🌳 **Tree-shakable** - Import only what you need
- 🏢 **Monorepo-friendly** - Each app can have its own database schema
- 🔄 **SSR/SSG Ready** - Optimized for Next.js with proper cookie handling

## Installation

```bash
npm install @99packages/database
# or
pnpm add @99packages/database
# or
yarn add @99packages/database
```

## Quick Start

### 1. Generate Your Database Types

First, generate your Supabase types for each app:

```bash
npx supabase gen types typescript --project-id "your-project-id" > types/supabase.ts
```

### 2. Set Up Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Use the Clients

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';

const supabase = await createSupabaseServerClient<Database>();
```

## Client Types

### Browser Client
For client-side operations in React components.

```typescript
import { createSupabaseBrowserClient } from '@99packages/database/supabase/client';
import type { Database } from '@/types/supabase';

export default function UserProfile() {
  const supabase = createSupabaseBrowserClient<Database>();
  
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  return <button onClick={signOut}>Sign Out</button>;
}
```

### Server Client
For server-side operations in Server Components, API routes, and Server Actions.

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient<Database>();
  const { data: users } = await supabase.from('users').select('*');
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}
```

### Middleware Client
For authentication checks in Next.js middleware.

```typescript
// middleware.ts
import { createSupabaseMiddlewareClient } from '@99packages/database/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient<Database>(request);
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/protected/:path*']
};
```

### Admin Client
For administrative operations using the service role key.

```typescript
import { createSupabaseAdminClient } from '@99packages/database/supabase/admin';
import type { Database } from '@/types/supabase';

export async function deleteUser(userId: string) {
  const adminClient = createSupabaseAdminClient<Database>();
  
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  
  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
```

## API Reference

### `createSupabaseBrowserClient<TDatabase>(url?, anonKey?)`

Creates a Supabase client for browser-side operations.

**Parameters:**
- `url` (optional): Supabase URL. Defaults to `NEXT_PUBLIC_SUPABASE_URL`
- `anonKey` (optional): Supabase anon key. Defaults to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TDatabase` (generic): Your database type interface

**Returns:** Supabase client instance

### `createSupabaseServerClient<TDatabase>(url?, anonKey?)`

Creates a Supabase client for server-side operations with cookie handling.

**Parameters:**
- `url` (optional): Supabase URL. Defaults to `NEXT_PUBLIC_SUPABASE_URL`
- `anonKey` (optional): Supabase anon key. Defaults to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TDatabase` (generic): Your database type interface

**Returns:** Promise<Supabase client instance>

### `createSupabaseMiddlewareClient<TDatabase>(request, url?, anonKey?)`

Creates a Supabase client for middleware with proper cookie management.

**Parameters:**
- `request`: NextRequest object
- `url` (optional): Supabase URL. Defaults to `NEXT_PUBLIC_SUPABASE_URL`
- `anonKey` (optional): Supabase anon key. Defaults to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TDatabase` (generic): Your database type interface

**Returns:** `{ supabase: SupabaseClient, response: NextResponse }`

### `createSupabaseAdminClient<TDatabase>(url?, serviceKey?)`

Creates a Supabase admin client with elevated permissions.

**Parameters:**
- `url` (optional): Supabase URL. Defaults to `NEXT_PUBLIC_SUPABASE_URL`
- `serviceKey` (optional): Service role key. Defaults to `SUPABASE_SERVICE_ROLE_KEY`
- `TDatabase` (generic): Your database type interface

**Returns:** Supabase admin client instance

## Advanced Usage

### Custom Configuration

You can override the default configuration by passing credentials directly:

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';

const supabase = await createSupabaseServerClient<Database>(
  'https://custom-project.supabase.co',
  'custom-anon-key'
);
```

### Multiple Supabase Projects

In a monorepo, different apps can connect to different Supabase projects:

```typescript
// App A
const supabaseA = await createSupabaseServerClient<DatabaseA>(
  process.env.SUPABASE_URL_A,
  process.env.SUPABASE_ANON_KEY_A
);

// App B
const supabaseB = await createSupabaseServerClient<DatabaseB>(
  process.env.SUPABASE_URL_B,
  process.env.SUPABASE_ANON_KEY_B
);
```

### Error Handling

All client creation functions will throw an error if required credentials are missing:

```typescript
try {
  const supabase = createSupabaseBrowserClient<Database>();
} catch (error) {
  console.error('Missing Supabase credentials:', error.message);
}
```

## Type Safety

### Without Types (Fallback)
```typescript
// Uses DefaultDatabase type - basic functionality
const supabase = createSupabaseBrowserClient();
```

### With Generated Types (Recommended)
```typescript
// Full type safety with your schema
import type { Database } from '@/types/supabase';
const supabase = createSupabaseBrowserClient<Database>();

// Now you get full autocomplete and type checking
const { data } = await supabase
  .from('users') // ✅ Autocompleted
  .select('id, email') // ✅ Column names are validated
  .eq('status', 'active'); // ✅ Values are type-checked
```

## Common Patterns

### Server Component with Error Handling

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';

export default async function UsersList() {
  try {
    const supabase = await createSupabaseServerClient<Database>();
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (
      <div>
        <h1>Users ({users?.length ?? 0})</h1>
        {users?.map(user => (
          <div key={user.id}>
            {user.email} - {new Date(user.created_at).toLocaleDateString()}
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return <div>Error loading users: {error.message}</div>;
  }
}
```

### API Route with Authentication

```typescript
// app/api/profile/route.ts
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient<Database>();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Real-time Subscriptions

```typescript
'use client';

import { createSupabaseBrowserClient } from '@99packages/database/supabase/client';
import type { Database } from '@/types/supabase';
import { useEffect, useState } from 'react';

export default function LiveMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const supabase = createSupabaseBrowserClient<Database>();

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

## Migration Guide

### From Direct Supabase Usage

**Before:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

**After:**
```typescript
import { createSupabaseBrowserClient } from '@99packages/database/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createSupabaseBrowserClient<Database>();
```

### From @supabase/ssr

**Before:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = cookies();
const supabase = createServerClient(url, key, { cookies: /* ... */ });
```

**After:**
```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { Database } from '@/types/supabase';

const supabase = await createSupabaseServerClient<Database>();
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   ```
   Error: Missing Supabase URL or anon key
   ```
   Solution: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

2. **Type errors with database operations**
   ```
   Property 'users' does not exist on type...
   ```
   Solution: Generate and import your Database types, then pass them to the client function.

3. **Cookie issues in middleware**
   ```
   Error: Headers cannot be modified after being sent
   ```
   Solution: Make sure to return the `response` object from `createSupabaseMiddlewareClient`.

### Debug Mode

Enable debug logging by setting the environment variable:

```env
DEBUG=supabase:*
```

## Contributing

Issues and pull requests are welcome! Please see the main package documentation for contribution guidelines.

## License

This package is part of the @99packages monorepo and follows the same license terms.
