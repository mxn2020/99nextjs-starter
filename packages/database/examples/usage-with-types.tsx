// Usage examples:
import type { Database } from './database.types'; // Adjust the import path as needed

// 1. In a server component:
import { createSupabaseServerClient } from '@99packages/database/supabase/server';

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient<Database>();
  const { data: users } = await supabase.from('users').select('*');
  return <div>{/* render users */}</div>;
}

// 2. In a client component:
import { createSupabaseBrowserClient } from '@99packages/database/supabase/client';
import type { Database } from '@/types/supabase';

export default function UserProfile() {
  const supabase = createSupabaseBrowserClient<Database>();
  // Use supabase client...
}

// 3. In middleware:
import { createSupabaseMiddlewareClient } from '@99packages/database/supabase/middleware';
import type { Database } from '@/types/supabase';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient<Database>(request);
  // Use supabase client...
}
