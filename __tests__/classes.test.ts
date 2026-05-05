import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Valid UUIDs for tests (Zod v4 enforces RFC 4122 variant bits)
const VALID_YEAR_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_CAT_UUID = '550e8400-e29b-41d4-a716-446655440001'

// ============================================================
// Unit Tests — Zod schemas
// ============================================================

describe('createClassSchema — name validation', () => {
  it('rejects empty name', async () => {
    const { createClassSchema } = await import('../lib/classes/schemas')
    const result = createClassSchema.safeParse({ name: '', academic_year_id: VALID_YEAR_UUID })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameError).toBeDefined()
    }
  })

  it('rejects missing name', async () => {
    const { createClassSchema } = await import('../lib/classes/schemas')
    const result = createClassSchema.safeParse({ academic_year_id: VALID_YEAR_UUID })
    expect(result.success).toBe(false)
  })

  it('accepts a valid name with required fields', async () => {
    const { createClassSchema } = await import('../lib/classes/schemas')
    const result = createClassSchema.safeParse({ name: 'Turma A', academic_year_id: VALID_YEAR_UUID })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields', async () => {
    const { createClassSchema } = await import('../lib/classes/schemas')
    const result = createClassSchema.safeParse({
      name: 'Turma A',
      academic_year_id: VALID_YEAR_UUID,
      level: '1º Ano',
      schedule: 'Sábados às 9h',
      catechist_ids: [VALID_CAT_UUID],
    })
    expect(result.success).toBe(true)
  })

  it('defaults catechist_ids to empty array when not provided', async () => {
    const { createClassSchema } = await import('../lib/classes/schemas')
    const result = createClassSchema.safeParse({ name: 'Turma A', academic_year_id: VALID_YEAR_UUID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.catechist_ids).toEqual([])
    }
  })
})

describe('createAcademicYearSchema — year validation', () => {
  it('rejects zero', async () => {
    const { createAcademicYearSchema } = await import('../lib/classes/schemas')
    const result = createAcademicYearSchema.safeParse({ year: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const yearError = result.error.issues.find((i) => i.path[0] === 'year')
      expect(yearError).toBeDefined()
    }
  })

  it('rejects negative year', async () => {
    const { createAcademicYearSchema } = await import('../lib/classes/schemas')
    const result = createAcademicYearSchema.safeParse({ year: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects decimal year', async () => {
    const { createAcademicYearSchema } = await import('../lib/classes/schemas')
    const result = createAcademicYearSchema.safeParse({ year: 2026.5 })
    expect(result.success).toBe(false)
  })

  it('accepts a positive integer year', async () => {
    const { createAcademicYearSchema } = await import('../lib/classes/schemas')
    const result = createAcademicYearSchema.safeParse({ year: 2026 })
    expect(result.success).toBe(true)
  })

  it('accepts year with is_active true', async () => {
    const { createAcademicYearSchema } = await import('../lib/classes/schemas')
    const result = createAcademicYearSchema.safeParse({ year: 2026, is_active: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_active).toBe(true)
  })
})

describe('updateClassSchema — is_archived', () => {
  it('accepts is_archived: true', async () => {
    const { updateClassSchema } = await import('../lib/classes/schemas')
    const result = updateClassSchema.safeParse({ is_archived: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_archived).toBe(true)
  })

  it('accepts is_archived: false', async () => {
    const { updateClassSchema } = await import('../lib/classes/schemas')
    const result = updateClassSchema.safeParse({ is_archived: false })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_archived).toBe(false)
  })

  it('accepts empty patch object', async () => {
    const { updateClassSchema } = await import('../lib/classes/schemas')
    const result = updateClassSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update', async () => {
    const { updateClassSchema } = await import('../lib/classes/schemas')
    const result = updateClassSchema.safeParse({ name: 'Turma B', schedule: 'Domingos às 10h' })
    expect(result.success).toBe(true)
  })
})

describe('inviteCatechistSchema', () => {
  it('rejects invalid email', async () => {
    const { inviteCatechistSchema } = await import('../lib/classes/schemas')
    const result = inviteCatechistSchema.safeParse({ email: 'not-email', full_name: 'Maria' })
    expect(result.success).toBe(false)
  })

  it('rejects empty full_name', async () => {
    const { inviteCatechistSchema } = await import('../lib/classes/schemas')
    const result = inviteCatechistSchema.safeParse({ email: 'a@b.com', full_name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid input', async () => {
    const { inviteCatechistSchema } = await import('../lib/classes/schemas')
    const result = inviteCatechistSchema.safeParse({ email: 'maria@church.com', full_name: 'Maria Rosa' })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// Mocks
// ============================================================

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), set: vi.fn() }),
}))

const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  vi.clearAllMocks()
})

afterEach(() => {
  process.env = { ...originalEnv }
})

// Fluent chain helper: methods return `this`, `single` and `maybeSingle` return a resolved promise.
function makeChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chainMethods = ['select', 'eq', 'order', 'in', 'neq', 'gt', 'lt']
  for (const m of chainMethods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  self.maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  // Make the chain awaitable directly (for calls that end without .single())
  self.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(resolvedValue).then(resolve)
  return self
}

// Insert chain: .insert().select().single() or .insert() (direct await)
function makeInsertChain(resolvedValue: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(resolvedValue)
  const selectAfterInsert = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select: selectAfterInsert, single })
  return { insert, selectAfterInsert, single }
}

// ============================================================
// Integration Tests — GET /api/classes
// ============================================================

describe('GET /api/classes — coordinator returns all classes', () => {
  it('returns 200 with all classes', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const mockClasses = [
      { id: 'cls-1', name: 'Turma A', is_archived: false },
      { id: 'cls-2', name: 'Turma B', is_archived: false },
    ]
    const classChain = makeChain({ data: mockClasses, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'coord-1', email: 'coord@test.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeChain({ data: { role: 'coordinator' }, error: null })
        }
        return classChain
      }),
    })

    const { GET } = await import('../app/api/classes/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })
})

describe('GET /api/classes — catechist returns only assigned classes (RLS)', () => {
  it('returns 200 with filtered classes for catechist', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    // RLS at the DB level returns only assigned; the route passes through
    const assignedClasses = [{ id: 'cls-1', name: 'Turma A', is_archived: false }]
    const classChain = makeChain({ data: assignedClasses, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'cat-1', email: 'cat@test.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeChain({ data: { role: 'catechist' }, error: null })
        }
        return classChain
      }),
    })

    const { GET } = await import('../app/api/classes/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('cls-1')
  })
})

describe('GET /api/classes — unauthorized', () => {
  it('returns 401 when no user', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    })
    const { GET } = await import('../app/api/classes/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })
})

// ============================================================
// Integration Tests — POST /api/classes
// ============================================================

describe('POST /api/classes — catechist gets 403', () => {
  it('returns 403', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'cat-1', email: 'cat@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain({ data: { role: 'catechist' }, error: null })),
    })
    const { POST } = await import('../app/api/classes/route')
    const request = new Request('http://localhost/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Turma X', academic_year_id: VALID_YEAR_UUID }),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})

describe('POST /api/classes — coordinator can create', () => {
  it('returns 201 when coordinator creates a class', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const newClass = { id: 'cls-new', name: 'Turma X', academic_year_id: VALID_YEAR_UUID, is_archived: false }
    const { insert: classInsert } = makeInsertChain({ data: newClass, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'coord-1', email: 'coord@test.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeChain({ data: { role: 'coordinator' }, error: null })
        }
        if (table === 'classes') {
          return { insert: classInsert }
        }
        return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    })

    const { POST } = await import('../app/api/classes/route')
    const request = new Request('http://localhost/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Turma X', academic_year_id: VALID_YEAR_UUID }),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'coord-1', email: 'coord@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain({ data: { role: 'coordinator' }, error: null })),
    })
    const { POST } = await import('../app/api/classes/route')
    const request = new Request('http://localhost/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ academic_year_id: VALID_YEAR_UUID }),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

// ============================================================
// Integration Tests — PATCH /api/classes/[id] (archive)
// ============================================================

describe('PATCH /api/classes/[id] — archive without delete', () => {
  it('sets is_archived: true and does NOT delete the record', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const updatedClass = { id: 'cls-1', name: 'Turma A', is_archived: true }

    const deleteClasses = vi.fn()
    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq })
    const fetchSingle = vi.fn().mockResolvedValue({ data: updatedClass, error: null })
    const fetchEq = vi.fn().mockReturnValue({ single: fetchSingle })
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'coord-1', email: 'coord@test.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeChain({ data: { role: 'coordinator' }, error: null })
        }
        if (table === 'classes') {
          return { update: updateMock, select: fetchSelect, delete: deleteClasses }
        }
        // class_catechists — not called since catechist_ids not in patch
        return { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) }
      }),
    })

    const { PATCH } = await import('../app/api/classes/[id]/route')
    const request = new Request('http://localhost/api/classes/cls-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: true }),
    }) as Parameters<typeof PATCH>[0]
    const response = await PATCH(request, { params: Promise.resolve({ id: 'cls-1' }) })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.is_archived).toBe(true)

    // Verify update called with is_archived: true
    expect(updateMock).toHaveBeenCalledWith({ is_archived: true })
    // Verify delete was NOT called on classes table
    expect(deleteClasses).not.toHaveBeenCalled()
  })
})

// ============================================================
// Integration Tests — GET /api/academic-years
// ============================================================

describe('GET /api/academic-years', () => {
  it('returns 200 with academic years for authenticated user', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const years = [{ id: VALID_YEAR_UUID, year: 2026, is_active: true }]
    const yearChain = makeChain({ data: years, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1', email: 'u@t.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(yearChain),
    })

    const { GET } = await import('../app/api/academic-years/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(1)
    expect(data[0].year).toBe(2026)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    })
    const { GET } = await import('../app/api/academic-years/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })
})

// ============================================================
// Integration Tests — GET /api/catechists
// ============================================================

describe('GET /api/catechists', () => {
  it('returns 403 for catechist role', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'cat-1', email: 'c@t.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain({ data: { role: 'catechist' }, error: null })),
    })
    const { GET } = await import('../app/api/catechists/route')
    const response = await GET()
    expect(response.status).toBe(403)
  })

  it('returns 200 with catechists for coordinator', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const catechists = [
      { id: VALID_CAT_UUID, full_name: 'Maria Rosa', role: 'catechist', created_at: '2026-01-01' },
    ]
    // Two calls to from('profiles'): role check and catechist list
    let profileCallCount = 0

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'coord-1', email: 'c@t.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          profileCallCount++
          if (profileCallCount === 1) {
            // role check: .select('role').eq('id', ...).single()
            return makeChain({ data: { role: 'coordinator' }, error: null })
          }
          // catechist list: .select(...).eq('role', 'catechist').order('full_name')
          return makeChain({ data: catechists, error: null })
        }
        return {}
      }),
    })

    const { GET } = await import('../app/api/catechists/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

// ============================================================
// createSupabaseAdminClient
// ============================================================

describe('createSupabaseAdminClient', () => {
  it('creates a client with the service role key', async () => {
    vi.resetModules()
    const { createClient } = await import('@supabase/supabase-js')
    const mockAdminClient = { auth: { admin: { inviteUserByEmail: vi.fn() } } }
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient)

    const { createSupabaseAdminClient } = await import('../lib/supabase/server')
    const client = createSupabaseAdminClient()
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-role-key',
      expect.objectContaining({ auth: expect.any(Object) })
    )
    expect(client).toBeDefined()
  })
})
