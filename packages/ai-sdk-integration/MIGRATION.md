# Migration Guide: Using Database Package Supabase Clients

This guide shows how to update your AI SDK Integration package to use the centralized Supabase clients from the `@99packages/database` package instead of direct imports.

## Overview

The AI SDK Integration package has been updated to use the shared Supabase clients from the `@99packages/database` package. This provides better consistency, type safety, and configuration management across your monorepo.

## Key Changes

### 1. Import Updates

**Before:**
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';
```

**After:**
```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
```

### 2. Client Instantiation

**Before:**
```typescript
const supabase = await createSupabaseServerClient();
```

**After:**
```typescript
const supabase = createSupabaseServerClient();
// Note: No await needed, the client is now synchronous
```

### 3. Type Safety Improvements

**Before:**
```typescript
// Generic SupabaseClient usage
const { data, error } = await supabase
  .from('ai_prompts')
  .insert(promptData)
  .select();
```

**After:**
```typescript
// With custom types (optional)
import type { Database } from '../types/database';

const supabase = createSupabaseServerClient<Database>();
const { data, error } = await supabase
  .from('ai_prompts')
  .insert(promptData)
  .select();
// Now has full type safety for your custom schema
```

## Updated Files

### Server Actions

All server action files have been updated:

1. **Text Generation** (`src/server/actions/text.ts`)
2. **Image Generation** (`src/server/actions/image.ts`) 
3. **Object Generation** (`src/server/actions/object.ts`)
4. **Agent Operations** (`src/server/actions/agent.ts`)

### Utility Functions

The Supabase helper utilities (`src/lib/utils/supabase-helpers.ts`) now expect the standardized client format.

## Custom Database Types

If your application has custom database types, you can create an extended interface:

```typescript
// types/ai-database.ts
import type { Database as BaseDatabase } from '@99packages/database/types';

interface AITables {
  ai_prompts: {
    Row: {
      id: string;
      account_id: string;
      user_id: string | null;
      prompt_text: string;
      created_at: string;
    };
    Insert: {
      account_id: string;
      user_id?: string | null;
      prompt_text: string;
    };
    Update: {
      account_id?: string;
      user_id?: string | null;
      prompt_text?: string;
    };
  };
  // Add other AI-specific tables...
}

export interface AIDatabase extends BaseDatabase {
  public: BaseDatabase['public'] & {
    Tables: BaseDatabase['public']['Tables'] & AITables;
  };
}
```

Then use it in your actions:

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import type { AIDatabase } from '../types/ai-database';

export async function generateTextAction(params: GenerateTextParams) {
  const supabase = createSupabaseServerClient<AIDatabase>();
  
  // Now has full type safety for AI tables
  const { data, error } = await supabase
    .from('ai_prompts')
    .insert({
      account_id: params.accountId,
      prompt_text: params.prompt,
    })
    .select()
    .single();
}
```

## Environment Configuration

The database package supports flexible configuration. You can use either:

### 1. Environment Variables (Default)
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Direct Configuration (Optional)
```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';

const supabase = createSupabaseServerClient({
  supabaseUrl: 'your_custom_url',
  supabaseServiceRoleKey: 'your_custom_key',
});
```

## Benefits of the Migration

### 1. Consistency
- All packages use the same Supabase client configuration
- Shared connection pooling and optimization
- Consistent error handling and logging

### 2. Type Safety
- Generic database types support custom schemas
- Better IntelliSense and compile-time checking
- Reduced runtime errors

### 3. Maintainability
- Centralized Supabase configuration
- Easier to update connection settings
- Single source of truth for database clients

### 4. Flexibility
- Support for multiple environments
- Easy credential override for testing
- Configurable connection parameters

## Testing the Migration

### 1. Verify Imports
Ensure all imports are updated and there are no TypeScript errors:

```bash
pnpm type-check
```

### 2. Test Database Operations
Create a simple test to verify the connection works:

```typescript
// test/supabase-connection.test.ts
import { createSupabaseServerClient } from '@99packages/database/supabase/server';

test('can connect to Supabase', async () => {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('count')
    .limit(1);
  
  expect(error).toBeNull();
  expect(data).toBeDefined();
});
```

### 3. Integration Testing
Test the full flow with a text generation:

```typescript
import { generateTextAction } from '@99packages/ai-sdk-integration';

test('can generate text with new client', async () => {
  const result = await generateTextAction({
    prompt: 'Hello, world!',
    accountId: 'test-account-id',
    modelId: 'gpt-4o-mini',
  });
  
  expect(result.error).toBeUndefined();
  expect(result.data).toBeDefined();
  expect(result.data?.text).toBeTruthy();
});
```

## Troubleshooting

### Common Issues

1. **Module Not Found**
   ```
   Cannot find module '@99packages/database/supabase/server'
   ```
   **Solution**: Ensure the database package is properly built and linked in your monorepo.

2. **Type Errors**
   ```
   Type 'unknown' is not assignable to type 'Database'
   ```
   **Solution**: Make sure you're importing the correct Database type or providing custom types.

3. **Environment Variables**
   ```
   Error: Supabase URL is required
   ```
   **Solution**: Verify all required environment variables are set in your `.env.local`.

### Debug Steps

1. Check package dependencies:
   ```bash
   pnpm list @99packages/database
   ```

2. Verify environment variables:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. Test the database package directly:
   ```typescript
   import { createSupabaseServerClient } from '@99packages/database/supabase/server';
   console.log('Client created successfully:', !!createSupabaseServerClient());
   ```

## Next Steps

After completing the migration:

1. **Remove old imports**: Clean up any remaining direct Supabase imports
2. **Update documentation**: Ensure team members know about the new import pattern
3. **Add custom types**: If needed, create application-specific database types
4. **Test thoroughly**: Run all tests to ensure everything works correctly

This migration provides a solid foundation for consistent database access across your entire monorepo while maintaining flexibility for application-specific needs.
