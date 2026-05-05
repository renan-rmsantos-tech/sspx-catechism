// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClassForm from '@/components/admin/class-form'
import type { AcademicYear, Profile } from '@/lib/supabase/types'

const academicYears: AcademicYear[] = [
  { id: '550e8400-e29b-41d4-a716-446655440000', year: 2026, is_active: true },
  { id: '550e8400-e29b-41d4-a716-446655440001', year: 2025, is_active: false },
]

const catechists: Profile[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    full_name: 'Maria Rosa',
    role: 'catechist',
    created_at: '2026-01-01',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    full_name: 'Pedro Alves',
    role: 'catechist',
    created_at: '2026-01-01',
  },
]

const noopAction = vi.fn().mockResolvedValue(null)

describe('ClassForm', () => {
  it('renders the name input', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByLabelText(/Nome da turma/i)).toBeInTheDocument()
  })

  it('renders academic year select with options', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByLabelText(/Ano letivo/i)).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('renders level and schedule inputs', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByLabelText(/Nível/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Horário/i)).toBeInTheDocument()
  })

  it('renders catechist checkboxes', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByText('Maria Rosa')).toBeInTheDocument()
    expect(screen.getByText('Pedro Alves')).toBeInTheDocument()

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('shows empty catechists message when list is empty', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={[]}
        action={noopAction}
      />
    )
    expect(screen.getByText(/Nenhum catequista cadastrado/i)).toBeInTheDocument()
  })

  it('pre-fills default values', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        defaultValues={{
          name: 'Turma A',
          level: '1º Ano',
          schedule: 'Sábados às 9h',
          catechist_ids: ['550e8400-e29b-41d4-a716-446655440010'],
        }}
        action={noopAction}
      />
    )
    const nameInput = screen.getByLabelText(/Nome da turma/i) as HTMLInputElement
    expect(nameInput.value).toBe('Turma A')

    const levelInput = screen.getByLabelText(/Nível/i) as HTMLInputElement
    expect(levelInput.value).toBe('1º Ano')

    const scheduleInput = screen.getByLabelText(/Horário/i) as HTMLInputElement
    expect(scheduleInput.value).toBe('Sábados às 9h')

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes[0].checked).toBe(true)  // Maria Rosa
    expect(checkboxes[1].checked).toBe(false) // Pedro Alves
  })

  it('renders the submit button with custom label', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
        submitLabel="Criar Turma"
      />
    )
    expect(screen.getByRole('button', { name: 'Criar Turma' })).toBeInTheDocument()
  })

  it('renders default submit label when not provided', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('renders the Catequistas section label', () => {
    render(
      <ClassForm
        academicYears={academicYears}
        catechists={catechists}
        action={noopAction}
      />
    )
    expect(screen.getByText('Catequistas')).toBeInTheDocument()
  })
})
