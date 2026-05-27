import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const dbUrl = process.env.SUPABASE_DB_URL

if (!dbUrl) {
  console.log('[migrate] SUPABASE_DB_URL não definida — migrações ignoradas')
  process.exit(0)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')

const client = new pg.Client({ connectionString: dbUrl })

try {
  await client.connect()

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const { rows: applied } = await client.query('SELECT name FROM schema_migrations')
  const appliedSet = new Set(applied.map((r) => r.name))

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let count = 0
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[migrate] ✓ ${file} (já aplicada)`)
      continue
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    console.log(`[migrate] ▶ Aplicando ${file}...`)

    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`[migrate] ✓ ${file} aplicada com sucesso`)
      count++
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[migrate] ✗ Falha em ${file}:`, err.message)
      process.exit(1)
    }
  }

  console.log(`[migrate] Concluído: ${count} nova(s), ${files.length - count} já aplicada(s)`)
} catch (err) {
  console.error('[migrate] Erro de conexão:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
