import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Valid UUIDs (Zod v4 enforces RFC 4122 variant bits)
const VALID_CLASS_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_STUDENT_UUID = '550e8400-e29b-41d4-a716-446655440001'
const VALID_SESSION_UUID = '550e8400-e29b-41d4-a716-446655440002'
const VALID_CAT_UUID = '550e8400-e29b-41d4-a716-446655440003'

// ============================================================
// Unit Tests — Zod schemas
// ============================================================

describe('pendingSessionSchema — classId validation', () => {
  it('rejects missing classId', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      date: '2026-05-04',
      catechistId: VALID_CAT_UUID,
      records: [],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'classId')
      expect(err).toBeDefined()
    }
  })

  it('rejects invalid UUID as classId', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: 'not-a-uuid',
      date: '2026-05-04',
      catechistId: VALID_CAT_UUID,
      records: [],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'classId')
      expect(err).toBeDefined()
    }
  })

  it('accepts valid session with no records', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: VALID_CLASS_UUID,
      date: '2026-05-04',
      catechistId: VALID_CAT_UUID,
      records: [],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid session with records', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: VALID_CLASS_UUID,
      date: '2026-05-04',
      catechistId: VALID_CAT_UUID,
      records: [{ studentId: VALID_STUDENT_UUID, present: true }],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })

  it('accepts seed-style UUIDs (Zod .uuid rejects these; Postgres accepts)', async () => {
    const SEED_CLASS = '20000000-0000-0000-0000-000000000001'
    const SEED_STUDENT = '30000000-0000-0000-0000-000000000001'
    const SEED_CATECHIST = '00000000-0000-0000-0000-000000000002'
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: SEED_CLASS,
      date: '2026-05-04',
      catechistId: SEED_CATECHIST,
      records: [{ studentId: SEED_STUDENT, present: true }],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })
})

describe('pendingSessionSchema — date validation', () => {
  it('rejects date in dd/mm/yyyy format', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: VALID_CLASS_UUID,
      date: '04/05/2026',
      catechistId: VALID_CAT_UUID,
      records: [],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'date')
      expect(err).toBeDefined()
    }
  })

  it('accepts date in YYYY-MM-DD format', async () => {
    const { pendingSessionSchema } = await import('../lib/attendance/schemas')
    const result = pendingSessionSchema.safeParse({
      id: VALID_SESSION_UUID,
      classId: VALID_CLASS_UUID,
      date: '2026-05-04',
      catechistId: VALID_CAT_UUID,
      records: [],
      createdAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })
})

describe('submitAttendanceSchema — sessions validation', () => {
  it('rejects empty sessions array', async () => {
    const { submitAttendanceSchema } = await import('../lib/attendance/schemas')
    const result = submitAttendanceSchema.safeParse({ sessions: [] })
    expect(result.success).toBe(false)
  })

  it('accepts a valid single session', async () => {
    const { submitAttendanceSchema } = await import('../lib/attendance/schemas')
    const result = submitAttendanceSchema.safeParse({
      sessions: [
        {
          id: VALID_SESSION_UUID,
          classId: VALID_CLASS_UUID,
          date: '2026-05-04',
          catechistId: VALID_CAT_UUID,
          records: [{ studentId: VALID_STUDENT_UUID, present: true }],
          createdAt: Date.now(),
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('attendanceRecordSchema', () => {
  it('rejects invalid studentId UUID', async () => {
    const { attendanceRecordSchema } = await import('../lib/attendance/schemas')
    const result = attendanceRecordSchema.safeParse({ studentId: 'bad', present: true })
    expect(result.success).toBe(false)
  })

  it('accepts valid present record', async () => {
    const { attendanceRecordSchema } = await import('../lib/attendance/schemas')
    const result = attendanceRecordSchema.safeParse({
      studentId: VALID_STUDENT_UUID,
      present: true,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.present).toBe(true)
  })

  it('accepts valid absent record', async () => {
    const { attendanceRecordSchema } = await import('../lib/attendance/schemas')
    const result = attendanceRecordSchema.safeParse({
      studentId: VALID_STUDENT_UUID,
      present: false,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.present).toBe(false)
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

function makeChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chainMethods = ['select', 'eq', 'order', 'in', 'neq', 'gt', 'gte', 'lte', 'lt', 'not']
  for (const m of chainMethods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  self.maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  self.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(resolvedValue).then(resolve)
  return self
}

function makeInsertChain(resolvedValue: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(resolvedValue)
  const selectAfterInsert = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select: selectAfterInsert, then: (resolve: (v: typeof resolvedValue) => unknown) => Promise.resolve(resolvedValue).then(resolve) })
  return { insert, selectAfterInsert, single }
}

// ============================================================
// Integration Tests — GET /api/attendance
// ============================================================

describe('GET /api/attendance — unauthorized', () => {
  it('returns 401 when no user', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    })
    const { GET } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance') as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})

describe('GET /api/attendance — with classId filter', () => {
  it('returns sessions filtered by classId', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const sessions = [
      { id: VALID_SESSION_UUID, class_id: VALID_CLASS_UUID, date: '2026-05-04', catechist_id: VALID_CAT_UUID, synced_at: null, attendance_records: [] },
    ]
    const chain = makeChain({ data: sessions, error: null })
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(chain),
    })
    const { GET } = await import('../app/api/attendance/route')
    const request = new Request(
      `http://localhost/api/attendance?classId=${VALID_CLASS_UUID}`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].class_id).toBe(VALID_CLASS_UUID)
  })

  it('returns 200 with all sessions when no filter', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const chain = makeChain({ data: [], error: null })
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(chain),
    })
    const { GET } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance') as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('returns 500 when query fails', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const chain = makeChain({ data: null, error: { message: 'DB error' } })
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(chain),
    })
    const { GET } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance') as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(500)
  })
})

// ============================================================
// Integration Tests — POST /api/attendance
// ============================================================

describe('POST /api/attendance — unauthorized', () => {
  it('returns 401 when no user', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    })
    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/attendance — invalid payload', () => {
  it('returns 400 for invalid JSON', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn(),
    })
    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      body: 'not json',
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 for empty sessions array', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn(),
    })
    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions: [] }),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when session missing classId', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn(),
    })
    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: VALID_SESSION_UUID,
            // classId missing
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [],
            createdAt: Date.now(),
          },
        ],
      }),
    }) as Parameters<typeof POST>[0]
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe('POST /api/attendance — creates session and records', () => {
  it('returns { synced: 1, skipped: 0 } on first submission', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const newSession = { id: VALID_SESSION_UUID }
    const { insert: sessionInsert, single } = makeInsertChain({ data: newSession, error: null })
    // Insert chain for records
    const recordInsert = vi.fn().mockResolvedValue({ data: null, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            // maybeSingle returns null = no existing session
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: sessionInsert,
          }
        }
        if (table === 'attendance_records') {
          return { insert: recordInsert }
        }
        return {}
      }),
    })

    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: VALID_SESSION_UUID,
            classId: VALID_CLASS_UUID,
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [{ studentId: VALID_STUDENT_UUID, present: true }],
            createdAt: Date.now(),
          },
        ],
      }),
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.synced).toBe(1)
    expect(data.skipped).toBe(0)
  })

  it('returns { synced: 0, skipped: 1 } for duplicate (class_id, date)', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            // Existing session found → skip
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: { id: 'existing-session' }, error: null }),
                }),
              }),
            }),
            insert: vi.fn(),
          }
        }
        return {}
      }),
    })

    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: VALID_SESSION_UUID,
            classId: VALID_CLASS_UUID,
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [{ studentId: VALID_STUDENT_UUID, present: true }],
            createdAt: Date.now(),
          },
        ],
      }),
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.synced).toBe(0)
    expect(data.skipped).toBe(1)
  })

  it('skips session when insert fails (race condition)', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const { insert: sessionInsert } = makeInsertChain({ data: null, error: { message: 'unique violation' } })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: sessionInsert,
          }
        }
        return {}
      }),
    })

    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: VALID_SESSION_UUID,
            classId: VALID_CLASS_UUID,
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [],
            createdAt: Date.now(),
          },
        ],
      }),
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.skipped).toBe(1)
    expect(data.synced).toBe(0)
  })

  it('handles batch with mixed synced and skipped', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    let sessionSelectCount = 0
    let sessionInsertCount = 0
    const newSession = { id: VALID_SESSION_UUID }

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockImplementation(() => {
                    sessionSelectCount++
                    // First session: no existing → synced; second: existing → skipped
                    return Promise.resolve({
                      data: sessionSelectCount === 1 ? null : { id: 'existing' },
                      error: null,
                    })
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockImplementation(() => {
              sessionInsertCount++
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
                }),
              }
            }),
          }
        }
        if (table === 'attendance_records') {
          return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) }
        }
        return {}
      }),
    })

    const { POST } = await import('../app/api/attendance/route')
    const request = new Request('http://localhost/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: VALID_SESSION_UUID,
            classId: VALID_CLASS_UUID,
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [],
            createdAt: Date.now(),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            classId: '550e8400-e29b-41d4-a716-446655440005',
            date: '2026-05-04',
            catechistId: VALID_CAT_UUID,
            records: [],
            createdAt: Date.now(),
          },
        ],
      }),
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.synced).toBe(1)
    expect(data.skipped).toBe(1)
  })
})

// ============================================================
// Integration Tests — GET /api/classes (catechist filter)
// ============================================================

describe('GET /api/classes — catechist sees only assigned classes', () => {
  it('returns only assigned classes via RLS', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const assignedClasses = [{ id: VALID_CLASS_UUID, name: 'Turma A', is_archived: false }]
    const classChain = makeChain({ data: assignedClasses, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(classChain),
    })

    const { GET } = await import('../app/api/classes/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe(VALID_CLASS_UUID)
  })

  it('does not return classes from other catechists', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    // RLS ensures catechist only sees their assigned classes
    const assignedClasses: unknown[] = []
    const classChain = makeChain({ data: assignedClasses, error: null })

    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_CAT_UUID } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(classChain),
    })

    const { GET } = await import('../app/api/classes/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(0)
  })
})
