import { createSupabaseBrowserClient } from '@99packages/database/supabase/client'
import type { Database } from '@/lib/database.types'

export const getBrowserClient = () => createSupabaseBrowserClient<Database>()

// For compatibility
export const createClient = getBrowserClient
