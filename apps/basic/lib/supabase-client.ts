import { createSupabaseBrowserClient } from '@99packages/database/supabase/client'
import type { Database } from '@/lib/types/supabase'

export const getBrowserClient = () => createSupabaseBrowserClient<Database>()

// For compatibility
export const createClient = getBrowserClient
