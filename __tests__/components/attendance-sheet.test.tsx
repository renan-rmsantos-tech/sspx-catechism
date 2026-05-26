// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AttendanceSheet from '@/components/dashboard/attendance-sheet'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/db', () => ({
  db: {
    pending_sessions: {
      add: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

vi.mock('@/lib/attendance-sync', () => ({
  registerBackgroundSync: vi.fn(),
  syncPendingSessions: vi.fn(),
}))

vi.mock('@/app/(auth)/login/actions', () => ({
  logoutAction: vi.fn(),
}))

const STUDENTS = [
  { id: 'stu-550e8400-e29b-41d4-a716-446655440001', full_name: 'Ana Clara Souza' },
  { id: 'stu-550e8400-e29b-41d4-a716-446655440002', full_name: 'Bruno Lima' },
  { id: 'stu-550e8400-e29b-41d4-a716-446655440003', full_name: 'Carla Melo' },
]

const DEFAULT_PROPS = {
  classId: '550e8400-e29b-41d4-a716-446655440000',
  className: 'Turma B — 2º Ano',
  date: '2026-05-04',
  catechistId: '550e8400-e29b-41d4-a716-446655440004',
  students: STUDENTS,
  formattedDate: '4 de maio de 2026',
}

describe('AttendanceSheet — initial state', () => {
  it('renders all students', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getAllByTestId('student-row')).toHaveLength(3)
  })

  it('shows 0 marcados counter in header', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('marked-counter')).toHaveTextContent('0 de 3 marcados')
  })

  it('shows all students as pendentes', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('pending-count')).toHaveTextContent('3 pendentes')
    expect(screen.getByTestId('present-count')).toHaveTextContent('0 presentes')
    expect(screen.getByTestId('absent-count')).toHaveTextContent('0 ausentes')
  })

  it('Confirmar Chamada button is disabled when students are unmarked', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    const btn = screen.getByTestId('btn-confirm')
    expect(btn).toBeDisabled()
  })

  it('shows the class name in header', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('chamada-header')).toHaveTextContent('Turma B — 2º Ano')
  })

  it('shows the formatted date in header', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('chamada-header')).toHaveTextContent('4 de maio de 2026')
  })

  it('shows logout on chamada header', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('btn-logout-chamada')).toBeInTheDocument()
  })
})

describe('AttendanceSheet — marking students', () => {
  it('marking student as present updates the counter', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    const student = STUDENTS[0]
    fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    expect(screen.getByTestId('marked-counter')).toHaveTextContent('1 de 3 marcados')
    expect(screen.getByTestId('pending-count')).toHaveTextContent('2 pendentes')
    expect(screen.getByTestId('present-count')).toHaveTextContent('1 presente')
  })

  it('marking student as absent updates the counter', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    const student = STUDENTS[1]
    fireEvent.click(screen.getByTestId(`btn-absent-${student.id}`))
    expect(screen.getByTestId('marked-counter')).toHaveTextContent('1 de 3 marcados')
    expect(screen.getByTestId('absent-count')).toHaveTextContent('1 ausente')
  })

  it('clicking the same button again unmarks the student (toggle off)', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    const student = STUDENTS[0]
    fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    expect(screen.getByTestId('present-count')).toHaveTextContent('1 presente')
    // Click again to unmark
    fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    expect(screen.getByTestId('present-count')).toHaveTextContent('0 presentes')
    expect(screen.getByTestId('pending-count')).toHaveTextContent('3 pendentes')
  })

  it('switching from present to absent updates correctly', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    const student = STUDENTS[0]
    fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    expect(screen.getByTestId('present-count')).toHaveTextContent('1 presente')
    fireEvent.click(screen.getByTestId(`btn-absent-${student.id}`))
    expect(screen.getByTestId('present-count')).toHaveTextContent('0 presentes')
    expect(screen.getByTestId('absent-count')).toHaveTextContent('1 ausente')
  })

  it('confirm button enabled when all students are marked', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    expect(screen.getByTestId('btn-confirm')).not.toBeDisabled()
  })

  it('confirm button remains disabled while any student is unmarked', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    // Mark only 2 of 3
    fireEvent.click(screen.getByTestId(`btn-present-${STUDENTS[0].id}`))
    fireEvent.click(screen.getByTestId(`btn-present-${STUDENTS[1].id}`))
    expect(screen.getByTestId('btn-confirm')).toBeDisabled()
  })

  it('shows 0 pendentes and all marked when all students confirmed', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    expect(screen.getByTestId('pending-count')).toHaveTextContent('0 pendentes')
    expect(screen.getByTestId('marked-counter')).toHaveTextContent('3 de 3 marcados')
  })
})

describe('AttendanceSheet — confirm submission', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440099'),
    })
  })

  it('calls fetch when confirming with all students marked', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ synced: 1, skipped: 0 }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/attendance',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows API error message when fetch returns not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'server error' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })
    expect(screen.getByText('server error')).toBeInTheDocument()
  })

  it('formats Zod validation issues from API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: [{ path: ['sessions', 0, 'classId'], message: 'ID de turma inválido' }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })
    expect(
      screen.getByText('sessions.0.classId: ID de turma inválido')
    ).toBeInTheDocument()
  })

  it('shows friendly message for Unauthorized from API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })
    expect(screen.getByText('Sessão expirada. Faça login novamente.')).toBeInTheDocument()
  })

  it('shows fallback when response is not JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError('bad json')),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })
    expect(screen.getByText('Erro ao salvar chamada (502)')).toBeInTheDocument()
  })
})

describe('AttendanceSheet — offline submit', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    })
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440099'),
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
  })

  it('saves to IndexedDB instead of calling fetch when offline', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const { db } = await import('@/lib/db')
    const addFn = db.pending_sessions.add as ReturnType<typeof vi.fn>
    addFn.mockClear()

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(addFn).toHaveBeenCalledTimes(1)
  })

  it('shows offline-saved message after saving to IndexedDB', async () => {
    vi.stubGlobal('fetch', vi.fn())

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })

    expect(screen.getByTestId('offline-saved-message')).toBeInTheDocument()
    expect(screen.getByTestId('offline-saved-message')).toHaveTextContent(
      'Chamada salva. Será sincronizada quando a conexão retornar.'
    )
  })

  it('saves session with correct shape to IndexedDB', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const { db } = await import('@/lib/db')
    const addFn = db.pending_sessions.add as ReturnType<typeof vi.fn>
    addFn.mockClear()

    render(<AttendanceSheet {...DEFAULT_PROPS} />)
    for (const student of STUDENTS) {
      fireEvent.click(screen.getByTestId(`btn-present-${student.id}`))
    }
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm'))
    })

    const savedSession = addFn.mock.calls[0][0]
    expect(savedSession.classId).toBe(DEFAULT_PROPS.classId)
    expect(savedSession.date).toBe(DEFAULT_PROPS.date)
    expect(savedSession.catechistId).toBe(DEFAULT_PROPS.catechistId)
    expect(savedSession.records).toHaveLength(STUDENTS.length)
  })
})

describe('AttendanceSheet — empty state', () => {
  it('shows empty state message when no students', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} students={[]} />)
    expect(screen.getByText('Nenhum aluno encontrado nesta turma.')).toBeInTheDocument()
  })

  it('confirm button is disabled when no students', () => {
    render(<AttendanceSheet {...DEFAULT_PROPS} students={[]} />)
    expect(screen.getByTestId('btn-confirm')).toBeDisabled()
  })
})

// ============================================================
// ClassCard tests
// ============================================================

describe('ClassCard', () => {
  it('renders class name', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A — 1º Ano"
        schedule="Sábados às 9h"
        studentCount={18}
        attendanceDone={true}
        presencePercent={78}
      />
    )
    expect(screen.getByText('Turma A — 1º Ano')).toBeInTheDocument()
  })

  it('renders Chamada feita badge when attendance done', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule="Sábados às 9h"
        studentCount={18}
        attendanceDone={true}
        presencePercent={78}
        isScheduledDay={true}
      />
    )
    expect(screen.getByText('Chamada feita')).toBeInTheDocument()
  })

  it('renders Pendente badge when attendance not done', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-2"
        name="Turma B"
        schedule={null}
        studentCount={14}
        attendanceDone={false}
        presencePercent={64}
        isScheduledDay={true}
      />
    )
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('renders student count', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule="Sábados às 9h"
        studentCount={18}
        attendanceDone={false}
        presencePercent={0}
      />
    )
    expect(screen.getByText(/18 alunos/)).toBeInTheDocument()
  })

  it('renders progress bar with correct aria attributes', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule={null}
        studentCount={5}
        attendanceDone={true}
        presencePercent={78}
      />
    )
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '78')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders presence percentage text', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule="Sábados às 9h"
        studentCount={10}
        attendanceDone={true}
        presencePercent={85}
      />
    )
    expect(screen.getByText('85% presença')).toBeInTheDocument()
  })

  it('renders schedule and student count together', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule="Domingos às 10h"
        studentCount={12}
        attendanceDone={false}
        presencePercent={0}
      />
    )
    expect(screen.getByText(/Domingos às 10h/)).toBeInTheDocument()
    expect(screen.getByText(/12 alunos/)).toBeInTheDocument()
  })

  it('renders singular aluno when count is 1', async () => {
    const { default: ClassCard } = await import('@/components/dashboard/class-card')
    render(
      <ClassCard
        id="cls-1"
        name="Turma A"
        schedule={null}
        studentCount={1}
        attendanceDone={false}
        presencePercent={0}
      />
    )
    expect(screen.getByText(/1 aluno$/)).toBeInTheDocument()
  })
})
