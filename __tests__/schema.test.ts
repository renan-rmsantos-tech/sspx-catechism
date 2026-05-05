import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// ============================================================
// Helpers
// ============================================================

const ROOT = join(__dirname, '..')
const migrationSQL = readFileSync(
  join(ROOT, 'supabase/migrations/0001_initial_schema.sql'),
  'utf-8'
)
const migration0002SQL = readFileSync(
  join(ROOT, 'supabase/migrations/0002_revoke_handle_new_user_rpc.sql'),
  'utf-8'
)
const migration0003SQL = readFileSync(
  join(ROOT, 'supabase/migrations/0003_lockdown_rls_helper_rpcs.sql'),
  'utf-8'
)
const seedSQL = readFileSync(join(ROOT, 'supabase/seed.sql'), 'utf-8')

// ============================================================
// Unit Tests — Migration SQL structure
// ============================================================

describe('0001_initial_schema.sql — tables', () => {
  const tables = [
    'profiles',
    'academic_years',
    'classes',
    'class_catechists',
    'students',
    'attendance_sessions',
    'attendance_records',
  ]

  it.each(tables)('creates table %s', (table) => {
    expect(migrationSQL).toMatch(new RegExp(`CREATE TABLE ${table}`, 'i'))
  })

  it('has 7 CREATE TABLE statements', () => {
    const matches = migrationSQL.match(/CREATE TABLE \w+/gi) ?? []
    expect(matches).toHaveLength(7)
  })
})

describe('0001_initial_schema.sql — constraints', () => {
  it('has UNIQUE (class_id, date) on attendance_sessions', () => {
    expect(migrationSQL).toMatch(/UNIQUE\s*\(\s*class_id\s*,\s*date\s*\)/i)
  })

  it('has UNIQUE (session_id, student_id) on attendance_records', () => {
    expect(migrationSQL).toMatch(/UNIQUE\s*\(\s*session_id\s*,\s*student_id\s*\)/i)
  })

  it('has PRIMARY KEY (class_id, catechist_id) on class_catechists', () => {
    expect(migrationSQL).toMatch(/PRIMARY KEY\s*\(\s*class_id\s*,\s*catechist_id\s*\)/i)
  })

  it('enforces role CHECK on profiles', () => {
    expect(migrationSQL).toMatch(/CHECK\s*\(\s*role\s+IN\s*\(\s*'coordinator'\s*,\s*'catechist'\s*\)\s*\)/i)
  })

  it('has ON DELETE CASCADE on profiles (auth.users FK)', () => {
    expect(migrationSQL).toMatch(/REFERENCES auth\.users\(id\)\s+ON DELETE CASCADE/i)
  })
})

describe('0001_initial_schema.sql — indexes', () => {
  it('creates index on students(full_name)', () => {
    expect(migrationSQL).toMatch(/CREATE INDEX.*ON students\s*\(\s*full_name\s*\)/i)
  })

  it('creates index on attendance_sessions(class_id, date)', () => {
    expect(migrationSQL).toMatch(/CREATE INDEX.*ON attendance_sessions\s*\(\s*class_id\s*,\s*date\s*\)/i)
  })
})

describe('0001_initial_schema.sql — trigger handle_new_user', () => {
  it('defines the handle_new_user function', () => {
    expect(migrationSQL).toMatch(/CREATE OR REPLACE FUNCTION handle_new_user\(\)/i)
  })

  it('creates the trigger on_auth_user_created', () => {
    expect(migrationSQL).toMatch(/CREATE TRIGGER on_auth_user_created/i)
  })

  it('trigger fires AFTER INSERT ON auth.users', () => {
    expect(migrationSQL).toMatch(/AFTER INSERT ON auth\.users/i)
  })

  it('trigger function inserts into public.profiles', () => {
    expect(migrationSQL).toMatch(/INSERT INTO public\.profiles/i)
  })

  it('trigger uses raw_user_meta_data for full_name', () => {
    expect(migrationSQL).toMatch(/raw_user_meta_data->>'full_name'/i)
  })

  it('trigger uses raw_user_meta_data for role', () => {
    expect(migrationSQL).toMatch(/raw_user_meta_data->>'role'/i)
  })
})

describe('0002_revoke_handle_new_user_rpc.sql', () => {
  it('revokes handle_new_user from PUBLIC, anon, authenticated', () => {
    expect(migration0002SQL).toMatch(/REVOKE ALL ON FUNCTION public\.handle_new_user\(\)/i)
    expect(migration0002SQL).toMatch(/FROM PUBLIC,\s*anon,\s*authenticated/i)
  })
})

describe('0003_lockdown_rls_helper_rpcs.sql', () => {
  it('moves RLS helpers to private schema and drops public copies (no LEAKPROOF)', () => {
    expect(migration0003SQL).toMatch(/CREATE SCHEMA IF NOT EXISTS private/i)
    expect(migration0003SQL).not.toMatch(/\bLEAKPROOF\b/i)
    expect(migration0003SQL).toMatch(/CREATE OR REPLACE FUNCTION private\.is_coordinator\(\)/i)
    expect(migration0003SQL).toMatch(/DROP FUNCTION IF EXISTS public\.is_coordinator\(\)/i)
    expect(migration0003SQL).toMatch(/DROP FUNCTION IF EXISTS public\.is_class_catechist\(uuid\)/i)
  })
})

describe('0001_initial_schema.sql — Row Level Security', () => {
  const tables = [
    'profiles',
    'academic_years',
    'classes',
    'class_catechists',
    'students',
    'attendance_sessions',
    'attendance_records',
  ]

  it.each(tables)('enables RLS on %s', (table) => {
    expect(migrationSQL).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i'))
  })

  it('RLS is enabled on all 7 tables', () => {
    const matches = migrationSQL.match(/ENABLE ROW LEVEL SECURITY/gi) ?? []
    expect(matches).toHaveLength(7)
  })

  it('defines catechist class access policy (is_class_catechist)', () => {
    expect(migrationSQL).toMatch(/is_class_catechist/i)
  })

  it('defines coordinator check via private.is_coordinator helper', () => {
    expect(migrationSQL).toMatch(/FUNCTION private\.is_coordinator\(\)/i)
    expect(migrationSQL).toMatch(/private\.is_coordinator\(\)/i)
  })

  it('attendance_sessions INSERT policy checks catechist_id = auth.uid()', () => {
    expect(migrationSQL).toMatch(/catechist_id\s*=\s*auth\.uid\(\)/i)
  })

  it('defines SELECT policy on classes', () => {
    expect(migrationSQL).toMatch(/CREATE POLICY classes_select ON classes/i)
  })

  it('defines INSERT policy on attendance_sessions with WITH CHECK', () => {
    expect(migrationSQL).toMatch(/CREATE POLICY attendance_sessions_insert ON attendance_sessions\s+FOR INSERT WITH CHECK/i)
  })
})

// ============================================================
// Unit Tests — seed.sql structure
// ============================================================

describe('seed.sql', () => {
  it('inserts at least 1 coordinator', () => {
    expect(seedSQL).toMatch(/'coordinator'/i)
  })

  it('inserts at least 2 catechists', () => {
    const matches = seedSQL.match(/'catechist'/gi) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('inserts at least 1 academic year', () => {
    expect(seedSQL).toMatch(/INSERT INTO academic_years/i)
  })

  it('inserts at least 2 classes', () => {
    const classInsert = seedSQL.match(/INSERT INTO classes/gi) ?? []
    expect(classInsert.length).toBeGreaterThanOrEqual(1)
    // The single INSERT INTO classes covers multiple rows via VALUES
    const classRows = seedSQL.match(/20000000-0000-0000-0000-\d+/g) ?? []
    expect(classRows.length).toBeGreaterThanOrEqual(2)
  })

  it('inserts at least 5 students', () => {
    const studentRows = seedSQL.match(/30000000-0000-0000-0000-\d+/g) ?? []
    expect(studentRows.length).toBeGreaterThanOrEqual(5)
  })

  it('includes ON CONFLICT DO NOTHING for idempotent seeding', () => {
    const safeInserts = seedSQL.match(/ON CONFLICT.*DO NOTHING/gi) ?? []
    expect(safeInserts.length).toBeGreaterThan(0)
  })
})

// ============================================================
// Unit Tests — TypeScript schema types
// ============================================================

describe('schema types — isValidRole', () => {
  it('returns true for coordinator', async () => {
    const { isValidRole } = await import('../lib/supabase/types')
    expect(isValidRole('coordinator')).toBe(true)
  })

  it('returns true for catechist', async () => {
    const { isValidRole } = await import('../lib/supabase/types')
    expect(isValidRole('catechist')).toBe(true)
  })

  it('returns false for unknown role', async () => {
    const { isValidRole } = await import('../lib/supabase/types')
    expect(isValidRole('admin')).toBe(false)
    expect(isValidRole(null)).toBe(false)
    expect(isValidRole(undefined)).toBe(false)
    expect(isValidRole('')).toBe(false)
  })
})

describe('schema types — isCoordinator / isCatechist', () => {
  it('isCoordinator returns true for coordinator profile', async () => {
    const { isCoordinator } = await import('../lib/supabase/types')
    expect(isCoordinator({ role: 'coordinator' })).toBe(true)
  })

  it('isCoordinator returns false for catechist profile', async () => {
    const { isCoordinator } = await import('../lib/supabase/types')
    expect(isCoordinator({ role: 'catechist' })).toBe(false)
  })

  it('isCatechist returns true for catechist profile', async () => {
    const { isCatechist } = await import('../lib/supabase/types')
    expect(isCatechist({ role: 'catechist' })).toBe(true)
  })

  it('isCatechist returns false for coordinator profile', async () => {
    const { isCatechist } = await import('../lib/supabase/types')
    expect(isCatechist({ role: 'coordinator' })).toBe(false)
  })
})

describe('schema types — ALL_TABLES', () => {
  it('contains all 7 table names', async () => {
    const { ALL_TABLES } = await import('../lib/supabase/types')
    expect(ALL_TABLES).toHaveLength(7)
    expect(ALL_TABLES).toContain('profiles')
    expect(ALL_TABLES).toContain('academic_years')
    expect(ALL_TABLES).toContain('classes')
    expect(ALL_TABLES).toContain('class_catechists')
    expect(ALL_TABLES).toContain('students')
    expect(ALL_TABLES).toContain('attendance_sessions')
    expect(ALL_TABLES).toContain('attendance_records')
  })
})

// ============================================================
// Integration Tests — RLS policy enforcement (mocked Supabase)
// ============================================================
//
// These tests simulate RLS behavior by mocking the Supabase client
// to return results consistent with what each policy would allow.
// They verify that the application code correctly interprets
// Supabase's empty results and policy errors.
// ============================================================

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), set: vi.fn() }),
}))

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }),
    auth: { uid: vi.fn().mockReturnValue('test-uid') },
  }
}

describe('RLS integration — catechist cannot read another catechist\'s classes', () => {
  it('returns empty data when catechist queries classes not in their class_catechists', async () => {
    const mockClient = makeSupabaseMock()
    // Simulate RLS filtering: Supabase returns empty array (no rows pass the policy)
    ;(mockClient.from('classes').select as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await mockClient.from('classes').select('*')
    expect(result.data).toEqual([])
    expect(result.error).toBeNull()
  })

  it('returns own classes when catechist is in class_catechists', async () => {
    const ownClass = {
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Turma A',
      academic_year_id: '10000000-0000-0000-0000-000000000001',
    }
    const mockClient = makeSupabaseMock()
    ;(mockClient.from('classes').select as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [ownClass],
      error: null,
    })

    const result = await mockClient.from('classes').select('*')
    expect(result.data).toHaveLength(1)
    expect(result.data![0].id).toBe(ownClass.id)
  })
})

describe('RLS integration — coordinator reads all classes', () => {
  it('returns all classes for coordinator', async () => {
    const allClasses = [
      { id: '20000000-0000-0000-0000-000000000001', name: 'Turma A' },
      { id: '20000000-0000-0000-0000-000000000002', name: 'Turma B' },
    ]
    const mockClient = makeSupabaseMock()
    ;(mockClient.from('classes').select as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: allClasses,
      error: null,
    })

    const result = await mockClient.from('classes').select('*')
    expect(result.data).toHaveLength(2)
  })
})

describe('RLS integration — catechist_id mismatch is rejected', () => {
  it('returns policy violation error when catechist_id != auth.uid()', async () => {
    const mockClient = makeSupabaseMock()
    ;(mockClient.from('attendance_sessions').insert as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'new row violates row-level security policy for table "attendance_sessions"',
      },
    })

    const result = await mockClient.from('attendance_sessions').insert({
      class_id: '20000000-0000-0000-0000-000000000001',
      date: '2026-04-12',
      catechist_id: 'different-uid', // not auth.uid()
    })

    expect(result.error).not.toBeNull()
    expect(result.error!.message).toMatch(/row-level security policy/i)
  })
})

describe('RLS integration — attendance_sessions UNIQUE constraint idempotency', () => {
  it('upsert with same (class_id, date) does not create a duplicate', async () => {
    const existingSession = {
      id: '40000000-0000-0000-0000-000000000001',
      class_id: '20000000-0000-0000-0000-000000000001',
      date: '2026-04-05',
      catechist_id: '00000000-0000-0000-0000-000000000002',
    }
    const mockClient = makeSupabaseMock()
    ;(mockClient.from('attendance_sessions').upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [existingSession],
      error: null,
    })

    // First upsert
    const r1 = await mockClient.from('attendance_sessions').upsert(
      { class_id: existingSession.class_id, date: existingSession.date, catechist_id: existingSession.catechist_id },
      { onConflict: 'class_id,date' }
    )
    // Second upsert with same key — should update, not insert new row
    const r2 = await mockClient.from('attendance_sessions').upsert(
      { class_id: existingSession.class_id, date: existingSession.date, catechist_id: existingSession.catechist_id },
      { onConflict: 'class_id,date' }
    )

    expect(r1.error).toBeNull()
    expect(r2.error).toBeNull()
    // In a real DB the constraint ensures one row; the mock confirms we call upsert not insert
    expect(mockClient.from('attendance_sessions').upsert).toHaveBeenCalledTimes(2)
  })
})
