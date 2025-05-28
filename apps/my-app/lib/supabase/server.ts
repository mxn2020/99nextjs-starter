import type { Database } from '@/lib/database.types'
import { createSupabaseServerClient } from '@99packages/database/supabase/server'
import { createSupabaseMiddlewareClient } from '@99packages/database/supabase/middleware'
import { createSupabaseAdminClient } from '@99packages/database/supabase/admin'
import { NextRequest } from 'next/server'

export const getServerClient = () => createSupabaseServerClient<Database>()
export const getAdminClient = () => createSupabaseAdminClient<Database>()
export const getMiddleWareClient = (request: NextRequest): ReturnType<typeof createSupabaseMiddlewareClient<Database>> => createSupabaseMiddlewareClient<Database>(request)

