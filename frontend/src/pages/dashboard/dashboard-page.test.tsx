import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { db } from '@/lib/db'

const catechistUser = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'catequista@example.com',
  fullName: 'Maria Catequista',
  role: 'catechist',
  mustChangePassword: false,
}

const classItem = {
  id: '11111111-1111-1111-1111-111111111111',
  academicYearId: 'year-1',
  name: 'Primeira Comunhão',
  level: null,
  schedule: 'Sábado 9h',
  isArchived: false,
  catechistIds: [catechistUser.id],
}

const students = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    classId: classItem.id,
    fullName: 'Ana Clara',
    isActive: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    classId: classItem.id,
    fullName: 'Bruno Santos',
    isActive: true,
  },
]

const today = () => new Date().toISOString().slice(0, 10)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function setupDashboardFetch() {
  const calls: Array<{ path: string; init?: RequestInit }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    calls.push({ path, init })
    if (path === '/api/auth/me') return jsonResponse(catechistUser)
    if (path === '/api/classes') return jsonResponse([classItem])
    if (path === '/api/academic-years') {
      return jsonResponse([{ id: 'year-1', year: 2026, isActive: true }])
    }
    if (path === '/api/attendance' && init?.method === 'POST') {
      return jsonResponse({ synced: 1, skipped: 0 })
    }
    if (path === '/api/attendance') return jsonResponse([])
    if (path === '/api/class-dates?academicYearId=year-1') {
      return jsonResponse({ dates: [today()], lockedDates: [] })
    }
    if (path === `/api/classes/${classItem.id}/students`) return jsonResponse(students)
    return jsonResponse({ status: 'ok' })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('catechist dashboard pages', () => {
  beforeEach(async () => {
    await db.pending_sessions.clear()
    await db.cached_class_dates.clear()
  })

  afterEach(async () => {
    await db.pending_sessions.clear()
    await db.cached_class_dates.clear()
    vi.restoreAllMocks()
  })

  it('renders assigned classes and links to the scheduled attendance sheet', async () => {
    setupDashboardFetch()
    renderAt('/dashboard')

    await screen.findByText('Primeira Comunhão')
    await waitFor(() => expect(screen.queryByText('Carregando turmas...')).not.toBeInTheDocument())

    expect(screen.getByTestId('class-card')).toHaveTextContent('2 alunos')
    expect(screen.getByTestId('btn-iniciar-chamada')).toHaveAttribute(
      'href',
      `/dashboard/turmas/${classItem.id}/chamada`,
    )
    expect(await db.cached_class_dates.get(['year-1', today()])).toBeTruthy()
  })

  it('submits an online attendance sheet to the attendance API', async () => {
    const { calls } = setupDashboardFetch()
    renderAt(`/dashboard/turmas/${classItem.id}/chamada`)

    await screen.findByText('Ana Clara')
    fireEvent.click(screen.getByLabelText('Marcar Ana Clara como presente'))
    fireEvent.click(screen.getByLabelText('Marcar Bruno Santos como ausente'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar chamada' }))

    await waitFor(() =>
      expect(calls.some((call) => call.path === '/api/attendance' && call.init?.method === 'POST')).toBe(true),
    )
    const post = calls.find((call) => call.path === '/api/attendance' && call.init?.method === 'POST')
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({
      sessions: [
        {
          classId: classItem.id,
          catechistId: catechistUser.id,
          date: today(),
          records: [
            { studentId: students[0].id, present: true },
            { studentId: students[1].id, present: false },
          ],
        },
      ],
    })
  })
})
