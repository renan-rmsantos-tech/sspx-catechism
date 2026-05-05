// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StudentForm from '@/components/admin/student-form'

const mockClasses = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Turma A' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Turma B' },
]

const mockAction = vi.fn()

describe('StudentForm', () => {
  it('renders section headers', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    // 'Turma' appears in both the section header <p> and the field label — verify at least one exists
    expect(screen.getAllByText('Turma').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Dados Pessoais')).toBeInTheDocument()
    expect(screen.getByText('Dados Pastorais')).toBeInTheDocument()
    expect(screen.getByText('Responsáveis')).toBeInTheDocument()
  })

  it('renders all field labels', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    expect(screen.getByLabelText('Nome Completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Data de Nascimento')).toBeInTheDocument()
    expect(screen.getByLabelText('Cidade')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do Pai')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome da Mãe / Responsável')).toBeInTheDocument()
    expect(screen.getByLabelText('Telefone de Contato')).toBeInTheDocument()
  })

  it('renders class select with options', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Turma A')).toBeInTheDocument()
    expect(screen.getByText('Turma B')).toBeInTheDocument()
  })

  it('renders Sim/Não toggles for first_communion and confirmation', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    const simButtons = screen.getAllByText('Sim')
    const naoButtons = screen.getAllByText('Não')
    expect(simButtons).toHaveLength(2)
    expect(naoButtons).toHaveLength(2)
  })

  it('renders submit button with default label', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    expect(screen.getByRole('button', { name: 'Salvar Aluno' })).toBeInTheDocument()
  })

  it('renders submit button with custom label', () => {
    render(
      <StudentForm classes={mockClasses} action={mockAction} submitLabel="Salvar Alterações" />
    )
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument()
  })

  it('populates defaultValues in edit mode', () => {
    render(
      <StudentForm
        classes={mockClasses}
        action={mockAction}
        defaultValues={{
          full_name: 'Ana Clara Souza',
          city: 'São Paulo',
          guardian_phone: '(11) 99999-9999',
        }}
      />
    )
    const nameInput = screen.getByPlaceholderText('Ex: Ana Clara Souza')
    expect(nameInput).toHaveValue('Ana Clara Souza')

    const cityInput = screen.getByPlaceholderText('Ex: São Paulo')
    expect(cityInput).toHaveValue('São Paulo')
  })

  it('renders pastoral section with textarea placeholders', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    const textareas = screen.getAllByPlaceholderText('Descreva brevemente...')
    expect(textareas).toHaveLength(2)
  })

  it('renders first_communion default as Não checked (false default)', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    // first_communion defaults to false, so "Não" radio for first_communion should be checked
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    // Order: [first_communion:true, first_communion:false, confirmation:true, confirmation:false]
    expect(radios[1]?.checked).toBe(true) // first_communion = false → Não checked
    expect(radios[3]?.checked).toBe(true) // confirmation = false → Não checked
  })

  it('renders first_communion as Sim checked when defaultValue is true', () => {
    render(
      <StudentForm
        classes={mockClasses}
        action={mockAction}
        defaultValues={{ first_communion: true }}
      />
    )
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios[0]?.checked).toBe(true) // first_communion = true → Sim checked
  })

  it('shows no error alert by default', () => {
    render(<StudentForm classes={mockClasses} action={mockAction} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
