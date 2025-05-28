import { createSupabaseServerClient } from '@99packages/database/supabase/server'
import { createSupabaseBrowserClient } from '@99packages/database/supabase/client'
import { createSupabaseAdminClient } from '@99packages/database/supabase/admin'
import type { Database } from '@/lib/types/supabase'

export const getServerClient = () => createSupabaseServerClient<Database>()
export const getBrowserClient = () => createSupabaseBrowserClient<Database>()
export const getAdminClient = () => createSupabaseAdminClient<Database>()

// Re-export only the client functions that are safe for browser use
export { createSupabaseBrowserClient } from '@99packages/database/supabase/client'
