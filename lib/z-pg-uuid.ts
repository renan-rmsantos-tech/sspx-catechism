import { z } from 'zod'

const PG_UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/** Hex UUID shape accepted by Postgres. Zod's `.uuid()` is RFC-4122–strict and rejects many stored IDs (e.g. `20000000-…` seed rows). */
export function zPgUuid(message = 'ID inválido'): z.ZodString {
  return z.string().regex(PG_UUID_RE, { message })
}
