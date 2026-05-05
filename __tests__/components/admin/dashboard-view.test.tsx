// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardView, { type ClassRow, type DashboardStats } from '@/components/admin/dashboard-view'

const defaultStats: DashboardStats = {
  activeClasses: 3,
  totalStudents: 45,
  avgAttendance: 74,
  sessionsToday: 2,
  totalClasses: 3,
}

const defaultClasses: ClassRow[] = [
  {
    id: 'cls-1',
    name: 'Turma A — 1º Ano',
    schedule: 'Sábados às 9h',
    catechists: ['Maria Rosa'],
    studentCount: 18,
    attendancePercent: 78,
    hasSessionToday: true,
  },
  {
    id: 'cls-2',
    name: 'Turma B — 2º Ano',
    schedule: 'Sábados às 10h',
    catechists: ['Pedro Alves'],
    studentCount: 14,
    attendancePercent: 64,
    hasSessionToday: false,
  },
]

describe('DashboardView', () => {
  it('renders the page title', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
  })

  it('renders the academic year and date subtitle', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText(/Ano letivo 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Segunda-feira, 4 de maio/)).toBeInTheDocument()
  })

  it('renders all 4 stat cards', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    const statsRow = screen.getByTestId('stats-row')
    expect(statsRow).toBeInTheDocument()
    expect(screen.getByText('Turmas Ativas')).toBeInTheDocument()
    expect(screen.getByText('Total de Alunos')).toBeInTheDocument()
    expect(screen.getByText('Presença Média')).toBeInTheDocument()
    expect(screen.getByText('Chamadas Hoje')).toBeInTheDocument()
  })

  it('renders the correct stat values', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('74%')).toBeInTheDocument()
  })

  it('renders active classes in the table', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    const table = screen.getByTestId('classes-table')
    expect(table).toBeInTheDocument()
    expect(screen.getByTestId('class-row-cls-1')).toBeInTheDocument()
    expect(screen.getByTestId('class-row-cls-2')).toBeInTheDocument()
    expect(screen.getByText('Turma A — 1º Ano')).toBeInTheDocument()
    expect(screen.getByText('Turma B — 2º Ano')).toBeInTheDocument()
  })

  it('renders catechist names in the table', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('Maria Rosa')).toBeInTheDocument()
    expect(screen.getByText('Pedro Alves')).toBeInTheDocument()
  })

  it('renders student counts', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('renders Feita badge for class with today\'s session', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getAllByText('Feita')).toHaveLength(1)
    expect(screen.getAllByText('Pendente')).toHaveLength(1)
  })

  it('renders the schedule for each class', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('Sábados às 9h')).toBeInTheDocument()
    expect(screen.getByText('Sábados às 10h')).toBeInTheDocument()
  })

  it('renders attendance bars with correct percentage', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveAttribute('aria-valuenow', '78')
    expect(bars[1]).toHaveAttribute('aria-valuenow', '64')
  })

  it('shows empty state when no classes', () => {
    render(
      <DashboardView
        stats={{ ...defaultStats, activeClasses: 0, totalClasses: 0 }}
        classes={[]}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.queryByTestId('classes-table')).not.toBeInTheDocument()
    expect(screen.getByText(/Nenhuma turma ativa/)).toBeInTheDocument()
  })

  it('renders dash when class has no catechists', () => {
    const noAssignment: ClassRow = {
      id: 'cls-3',
      name: 'Turma C',
      schedule: null,
      catechists: [],
      studentCount: 0,
      attendancePercent: 0,
      hasSessionToday: false,
    }
    render(
      <DashboardView
        stats={defaultStats}
        classes={[noAssignment]}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders "Novo Aluno" button', () => {
    render(
      <DashboardView
        stats={defaultStats}
        classes={defaultClasses}
        academicYearLabel="Ano letivo 2026"
        dateLabel="Segunda-feira, 4 de maio"
      />
    )
    expect(screen.getByText('Novo Aluno')).toBeInTheDocument()
  })
})
