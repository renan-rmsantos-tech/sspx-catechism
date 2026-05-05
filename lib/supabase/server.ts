import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getPublicEnv, getServiceRoleKey } from './config'

export async function createSupabaseServerClient() {
  const { url, anonKey } = getPublicEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies — safe to ignore here
        }
      },
    },
  })
}

export function createSupabaseAdminClient() {
  const { url } = getPublicEnv()
  const serviceRoleKey = getServiceRoleKey()
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
