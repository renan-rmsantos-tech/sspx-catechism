// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RelatoriosForm from '../components/admin/relatorios-form'

const VALID_CLASS_UUID = '550e8400-e29b-41d4-a716-446655440000'

const mockClasses = [
  { id: VALID_CLASS_UUID, name: 'Turma A' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Turma B' },
]

const mockReport = {
  className: 'Turma A',
  students: [{ id: 's1', full_name: 'João Silva' }],
  sessions: [{ id: 'sess1', date: '2026-03-15' }],
  records: [{ session_id: 'sess1', student_id: 's1', present: true }],
}

function fillForm() {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: VALID_CLASS_UUID } })
  fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })
}

describe('RelatoriosForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  it('renders the class select with options', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    expect(screen.getByText('Turma A')).toBeDefined()
    expect(screen.getByText('Turma B')).toBeDefined()
  })

  it('renders from and to date inputs', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    expect(screen.getByLabelText('De')).toBeDefined()
    expect(screen.getByLabelText('Até')).toBeDefined()
  })

  it('Visualizar button is disabled when form is incomplete', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    const btn = screen.getByText('Visualizar') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('Visualizar button becomes enabled when all fields are filled', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    fillForm()
    const btn = screen.getByText('Visualizar') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('shows download buttons after loading report', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockReport), { status: 200 })
    )

    render(<RelatoriosForm classes={mockClasses} />)
    fillForm()
    fireEvent.click(screen.getByText('Visualizar'))

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument()
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })
  })

  it('clicking PDF button navigates to the correct API URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockReport), { status: 200 })
    )

    render(<RelatoriosForm classes={mockClasses} />)
    fillForm()
    fireEvent.click(screen.getByText('Visualizar'))

    await waitFor(() => expect(screen.getByText('PDF')).toBeInTheDocument())

    fireEvent.click(screen.getByText('PDF'))
    expect(window.location.href).toContain('format=pdf')
    expect(window.location.href).toContain(VALID_CLASS_UUID)
    expect(window.location.href).toContain('from=2026-01-01')
    expect(window.location.href).toContain('to=2026-12-31')
  })

  it('clicking Excel button navigates to the correct API URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockReport), { status: 200 })
    )

    render(<RelatoriosForm classes={mockClasses} />)
    fillForm()
    fireEvent.click(screen.getByText('Visualizar'))

    await waitFor(() => expect(screen.getByText('Excel')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Excel'))
    expect(window.location.href).toContain('format=xlsx')
  })

  it('renders with empty classes list', () => {
    render(<RelatoriosForm classes={[]} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    expect(screen.getByText('Selecione uma turma')).toBeDefined()
  })
})
