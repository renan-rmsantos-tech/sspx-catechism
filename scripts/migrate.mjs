import { execSync } from 'node:child_process'

const dbUrl = process.env.SUPABASE_DB_URL

if (!dbUrl) {
  console.log('[migrate] SUPABASE_DB_URL não definida — migrações ignoradas')
  process.exit(0)
}

console.log('[migrate] Aplicando migrações...')
try {
  execSync(`npx supabase db push --db-url "${dbUrl}"`, { stdio: 'inherit' })
  console.log('[migrate] Migrações aplicadas com sucesso')
} catch (err) {
  console.error('[migrate] Falha ao aplicar migrações:', err.message)
  process.exit(1)
}
