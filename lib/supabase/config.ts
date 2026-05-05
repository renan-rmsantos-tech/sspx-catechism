function firstNonEmptyEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim()
    if (v) return v
  }
  return undefined
}

export function getPublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = firstNonEmptyEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  )

  if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  return { url, anonKey }
}

/** Supabase secret key (`sb_secret_...`, recommended) or legacy JWT `service_role`. */
export function getSupabaseSecretKey(): string {
  const key = firstNonEmptyEnv('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
  if (!key) {
    throw new Error(
      'Missing required environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  return key
}

/** @deprecated Prefer `getSupabaseSecretKey` — kept for callsites/tests that still use this name. */
export function getServiceRoleKey(): string {
  return getSupabaseSecretKey()
}
