// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('shows error message when fetch fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
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
    expect(screen.getByText('Erro ao salvar chamada')).toBeInTheDocument()
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
