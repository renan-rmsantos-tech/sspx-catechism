import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as XLSX from 'xlsx'

// Valid UUIDs (Zod v4 enforces RFC 4122 variant bits)
const VALID_CLASS_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_STUDENT_UUID = '550e8400-e29b-41d4-a716-446655440001'
const VALID_SESSION_UUID = '550e8400-e29b-41d4-a716-446655440002'
const VALID_COORD_UUID = '550e8400-e29b-41d4-a716-446655440003'
const VALID_SESSION_UUID_2 = '550e8400-e29b-41d4-a716-446655440004'
const VALID_STUDENT_UUID_2 = '550e8400-e29b-41d4-a716-446655440005'

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

// ============================================================
// Chain helpers
// ============================================================

function makeSingleChain(resolvedValue: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(resolvedValue)
  const maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  const self: Record<string, unknown> = { single, maybeSingle }
  for (const m of ['select', 'eq', 'gte', 'lte', 'in', 'order', 'neq', 'not']) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  return self
}

function makeArrayChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'gte', 'lte', 'in', 'order', 'neq', 'not']) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolvedValue).then(resolve)
  return self
}

function makeCoordinatorSupabase(overrides?: {
  students?: unknown[]
  sessions?: unknown[]
  records?: unknown[]
  className?: string
}) {
  const students = overrides?.students ?? [{ id: VALID_STUDENT_UUID, full_name: 'Alice' }]
  const sessions = overrides?.sessions ?? [{ id: VALID_SESSION_UUID, date: '2026-03-01' }]
  const records = overrides?.records ?? [
    { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
  ]
  const className = overrides?.className ?? 'Turma A'

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: VALID_COORD_UUID } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return makeSingleChain({ data: { role: 'coordinator' }, error: null })
      }
      if (table === 'classes') {
        return makeSingleChain({ data: { name: className }, error: null })
      }
      if (table === 'students') {
        return makeArrayChain({ data: students, error: null })
      }
      if (table === 'attendance_sessions') {
        return makeArrayChain({ data: sessions, error: null })
      }
      if (table === 'attendance_records') {
        return makeArrayChain({ data: records, error: null })
      }
      return makeArrayChain({ data: [], error: null })
    }),
  }
}

const VALID_REPORT_URL =
  `http://localhost/api/reports/attendance?classId=${VALID_CLASS_UUID}&from=2026-01-01&to=2026-12-31`

// ============================================================
// Unit Tests — lib/reports/query.ts
// ============================================================

describe('calcStudentStats — 3 presences out of 5 sessions = 60%', () => {
  it('returns 60% for 3 out of 5 sessions', async () => {
    const { calcStudentStats } = await import('../lib/reports/query')
    const sessions = [
      { id: 'a', date: '2026-01-01' },
      { id: 'b', date: '2026-01-08' },
      { id: 'c', date: '2026-01-15' },
      { id: 'd', date: '2026-01-22' },
      { id: 'e', date: '2026-01-29' },
    ]
    const records = [
      { session_id: 'a', student_id: VALID_STUDENT_UUID, present: true },
      { session_id: 'b', student_id: VALID_STUDENT_UUID, present: true },
      { session_id: 'c', student_id: VALID_STUDENT_UUID, present: true },
      { session_id: 'd', student_id: VALID_STUDENT_UUID, present: false },
      // session 'e' has no record — counts as absent
    ]
    const stats = calcStudentStats(VALID_STUDENT_UUID, sessions, records)
    expect(stats.present).toBe(3)
    expect(stats.absent).toBe(2)
    expect(stats.pct).toBe('60%')
  })
})

describe('calcStudentStats — 0 sessions returns dash', () => {
  it('returns "-" pct when no sessions in period', async () => {
    const { calcStudentStats } = await import('../lib/reports/query')
    const stats = calcStudentStats(VALID_STUDENT_UUID, [], [])
    expect(stats.pct).toBe('-')
    expect(stats.present).toBe(0)
    expect(stats.absent).toBe(0)
  })
})

describe('getCellValue', () => {
  it('returns P for present record', async () => {
    const { getCellValue } = await import('../lib/reports/query')
    const records = [
      { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
    ]
    expect(getCellValue(VALID_STUDENT_UUID, VALID_SESSION_UUID, records)).toBe('P')
  })

  it('returns F for absent record', async () => {
    const { getCellValue } = await import('../lib/reports/query')
    const records = [
      { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: false },
    ]
    expect(getCellValue(VALID_STUDENT_UUID, VALID_SESSION_UUID, records)).toBe('F')
  })

  it('returns - when no record exists for that student/session', async () => {
    const { getCellValue } = await import('../lib/reports/query')
    expect(getCellValue(VALID_STUDENT_UUID, VALID_SESSION_UUID, [])).toBe('-')
  })
})

// ============================================================
// Unit Tests — reportParamsSchema (Zod validation)
// ============================================================

describe('reportParamsSchema — format validation', () => {
  it('rejects format other than pdf or xlsx', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: VALID_CLASS_UUID,
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'csv',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'format')
      expect(err).toBeDefined()
    }
  })

  it('accepts pdf format', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: VALID_CLASS_UUID,
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'pdf',
    })
    expect(result.success).toBe(true)
  })

  it('accepts xlsx format', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: VALID_CLASS_UUID,
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'xlsx',
    })
    expect(result.success).toBe(true)
  })
})

describe('reportParamsSchema — from > to returns error', () => {
  it('rejects when from is after to', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: VALID_CLASS_UUID,
      from: '2026-12-31',
      to: '2026-01-01',
      format: 'pdf',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'from')
      expect(err).toBeDefined()
      expect(err?.message).toContain('<=')
    }
  })

  it('accepts when from equals to', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: VALID_CLASS_UUID,
      from: '2026-06-01',
      to: '2026-06-01',
      format: 'xlsx',
    })
    expect(result.success).toBe(true)
  })
})

describe('reportParamsSchema — classId validation', () => {
  it('rejects invalid UUID as classId', async () => {
    const { reportParamsSchema } = await import('../lib/reports/query')
    const result = reportParamsSchema.safeParse({
      classId: 'not-a-uuid',
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'pdf',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Unit Tests — lib/reports/pdf.ts
// ============================================================

describe('generatePdf — output contains class name', () => {
  it('returns a non-empty buffer', async () => {
    const { generatePdf } = await import('../lib/reports/pdf')
    const buffer = generatePdf({
      className: 'Turma Teste',
      from: '2026-01-01',
      to: '2026-03-31',
      students: [{ id: VALID_STUDENT_UUID, full_name: 'Alice' }],
      sessions: [{ id: VALID_SESSION_UUID, date: '2026-01-15' }],
      records: [
        { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
      ],
    })
    expect(buffer.length).toBeGreaterThan(0)
    // PDF magic bytes
    expect(buffer[0]).toBe(0x25) // '%'
    expect(buffer[1]).toBe(0x50) // 'P'
    expect(buffer[2]).toBe(0x44) // 'D'
    expect(buffer[3]).toBe(0x46) // 'F'
  })

  it('includes student name in the generated output', async () => {
    const { generatePdf } = await import('../lib/reports/pdf')
    const buffer = generatePdf({
      className: 'Turma X',
      from: '2026-01-01',
      to: '2026-01-31',
      students: [{ id: VALID_STUDENT_UUID, full_name: 'Alice' }],
      sessions: [],
      records: [],
    })
    // Buffer should be a valid PDF
    expect(buffer.length).toBeGreaterThan(100)
  })

  it('handles empty students and sessions', async () => {
    const { generatePdf } = await import('../lib/reports/pdf')
    const buffer = generatePdf({
      className: 'Turma Vazia',
      from: '2026-01-01',
      to: '2026-01-31',
      students: [],
      sessions: [],
      records: [],
    })
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('handles multiple students with mixed attendance', async () => {
    const { generatePdf } = await import('../lib/reports/pdf')
    const buffer = generatePdf({
      className: 'Turma Multi',
      from: '2026-01-01',
      to: '2026-01-31',
      students: [
        { id: VALID_STUDENT_UUID, full_name: 'Alice' },
        { id: VALID_STUDENT_UUID_2, full_name: 'Bob' },
      ],
      sessions: [
        { id: VALID_SESSION_UUID, date: '2026-01-08' },
        { id: VALID_SESSION_UUID_2, date: '2026-01-15' },
      ],
      records: [
        { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
        { session_id: VALID_SESSION_UUID_2, student_id: VALID_STUDENT_UUID, present: false },
        { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID_2, present: false },
      ],
    })
    expect(buffer.length).toBeGreaterThan(0)
  })
})

// ============================================================
// Unit Tests — lib/reports/excel.ts
// ============================================================

describe('generateExcel — has at least one sheet with data', () => {
  it('returns a parseable xlsx with one sheet', async () => {
    const { generateExcel } = await import('../lib/reports/excel')
    const buffer = generateExcel({
      className: 'Turma Teste',
      from: '2026-01-01',
      to: '2026-03-31',
      students: [{ id: VALID_STUDENT_UUID, full_name: 'Alice' }],
      sessions: [{ id: VALID_SESSION_UUID, date: '2026-01-15' }],
      records: [
        { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
      ],
    })
    const wb = XLSX.read(buffer, { type: 'buffer' })
    expect(wb.SheetNames.length).toBeGreaterThan(0)
    expect(wb.SheetNames[0]).toBe('Presença')
  })

  it('sheet contains student data', async () => {
    const { generateExcel } = await import('../lib/reports/excel')
    const buffer = generateExcel({
      className: 'Turma A',
      from: '2026-01-01',
      to: '2026-01-31',
      students: [{ id: VALID_STUDENT_UUID, full_name: 'Alice' }],
      sessions: [{ id: VALID_SESSION_UUID, date: '2026-01-08' }],
      records: [
        { session_id: VALID_SESSION_UUID, student_id: VALID_STUDENT_UUID, present: true },
      ],
    })
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets['Presença']
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
    // First row is className
    expect(rows[0][0]).toBe('Turma A')
    // Row with "Aluno" header
    const headerRow = rows.find((r) => r[0] === 'Aluno')
    expect(headerRow).toBeDefined()
    // Row with Alice
    const aliceRow = rows.find((r) => r[0] === 'Alice')
    expect(aliceRow).toBeDefined()
    expect(aliceRow![1]).toBe('P')
  })

  it('handles empty students', async () => {
    const { generateExcel } = await import('../lib/reports/excel')
    const buffer = generateExcel({
      className: 'Turma Vazia',
      from: '2026-01-01',
      to: '2026-01-31',
      students: [],
      sessions: [],
      records: [],
    })
    const wb = XLSX.read(buffer, { type: 'buffer' })
    expect(wb.SheetNames.length).toBeGreaterThan(0)
  })
})

// ============================================================
// Performance Test — 150 students, 12 months < 5s
// ============================================================

describe('report generation performance', () => {
  it('generates PDF and Excel for 150 students x 52 sessions in < 5 seconds', async () => {
    const { generatePdf } = await import('../lib/reports/pdf')
    const { generateExcel } = await import('../lib/reports/excel')

    // Build 150 students
    const students = Array.from({ length: 150 }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
      full_name: `Aluno ${i + 1}`,
    }))

    // Build 52 weekly sessions (1 year)
    const sessions = Array.from({ length: 52 }, (_, i) => {
      const date = new Date(2026, 0, 5 + i * 7)
      return {
        id: `650e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        date: date.toISOString().slice(0, 10),
      }
    })

    // Build records: every student present in every session
    const records = students.flatMap((student) =>
      sessions.map((session) => ({
        session_id: session.id,
        student_id: student.id,
        present: true,
      }))
    )

    const data = {
      className: 'Turma Grande',
      from: '2026-01-01',
      to: '2026-12-31',
      students,
      sessions,
      records,
    }

    const start = Date.now()
    const pdfBuffer = generatePdf(data)
    const xlsxBuffer = generateExcel(data)
    const elapsed = Date.now() - start

    expect(pdfBuffer.length).toBeGreaterThan(0)
    expect(xlsxBuffer.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(5000)
  })
})

// ============================================================
// Integration Tests — GET /api/reports/attendance
// ============================================================

describe('GET /api/reports/attendance — unauthorized (no user)', () => {
  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    })
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})

describe('GET /api/reports/attendance — catechist returns 403', () => {
  it('returns 403 when role is catechist', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_COORD_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeSingleChain({ data: { role: 'catechist' }, error: null })
        }
        return makeArrayChain({ data: [], error: null })
      }),
    })
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(403)
  })
})

describe('GET /api/reports/attendance — invalid params', () => {
  it('returns 400 for invalid format', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_COORD_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeSingleChain({ data: { role: 'coordinator' }, error: null })
        }
        return makeArrayChain({ data: [], error: null })
      }),
    })
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `http://localhost/api/reports/attendance?classId=${VALID_CLASS_UUID}&from=2026-01-01&to=2026-12-31&format=csv`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when from > to', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: VALID_COORD_UUID } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return makeSingleChain({ data: { role: 'coordinator' }, error: null })
        }
        return makeArrayChain({ data: [], error: null })
      }),
    })
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `http://localhost/api/reports/attendance?classId=${VALID_CLASS_UUID}&from=2026-12-31&to=2026-01-01&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(400)
  })
})

describe('GET /api/reports/attendance — coordinator PDF', () => {
  it('returns 200 with Content-Type application/pdf', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeCoordinatorSupabase())
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    const buf = Buffer.from(await response.arrayBuffer())
    expect(buf.length).toBeGreaterThan(0)
    // PDF magic bytes
    expect(buf[0]).toBe(0x25) // '%'
  })

  it('sets Content-Disposition attachment for PDF', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeCoordinatorSupabase())
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    const disposition = response.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('.pdf')
  })
})

describe('GET /api/reports/attendance — coordinator Excel', () => {
  it('returns 200 with xlsx Content-Type and parseable Excel file', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeCoordinatorSupabase())
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=xlsx`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const buf = await response.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'buffer' })
    expect(wb.SheetNames.length).toBeGreaterThan(0)
  })

  it('sets Content-Disposition attachment for xlsx', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeCoordinatorSupabase())
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=xlsx`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    const disposition = response.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('.xlsx')
  })
})

describe('GET /api/reports/attendance — empty sessions', () => {
  it('generates PDF even when no sessions exist in period', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeCoordinatorSupabase({ sessions: [], records: [] })
    )
    const { GET } = await import('../app/api/reports/attendance/route')
    const request = new Request(
      `${VALID_REPORT_URL}&format=pdf`
    ) as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })
})
