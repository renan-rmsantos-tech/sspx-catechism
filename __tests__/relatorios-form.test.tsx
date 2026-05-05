// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RelatoriosForm from '../components/admin/relatorios-form'

const VALID_CLASS_UUID = '550e8400-e29b-41d4-a716-446655440000'

const mockClasses = [
  { id: VALID_CLASS_UUID, name: 'Turma A' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Turma B' },
]

describe('RelatoriosForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.href after each test
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

  it('renders download PDF and Excel buttons', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    expect(screen.getByLabelText('Baixar relatório em PDF')).toBeDefined()
    expect(screen.getByLabelText('Baixar relatório em Excel')).toBeDefined()
  })

  it('buttons are disabled when form is incomplete', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    const pdfBtn = screen.getByLabelText('Baixar relatório em PDF') as HTMLButtonElement
    const xlsxBtn = screen.getByLabelText('Baixar relatório em Excel') as HTMLButtonElement
    expect(pdfBtn.disabled).toBe(true)
    expect(xlsxBtn.disabled).toBe(true)
  })

  it('buttons become enabled when all fields are filled', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: VALID_CLASS_UUID } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })

    const pdfBtn = screen.getByLabelText('Baixar relatório em PDF') as HTMLButtonElement
    const xlsxBtn = screen.getByLabelText('Baixar relatório em Excel') as HTMLButtonElement
    expect(pdfBtn.disabled).toBe(false)
    expect(xlsxBtn.disabled).toBe(false)
  })

  it('clicking PDF button navigates to the correct API URL', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: VALID_CLASS_UUID } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })

    fireEvent.click(screen.getByLabelText('Baixar relatório em PDF'))
    expect(window.location.href).toContain('format=pdf')
    expect(window.location.href).toContain(VALID_CLASS_UUID)
    expect(window.location.href).toContain('from=2026-01-01')
    expect(window.location.href).toContain('to=2026-12-31')
  })

  it('clicking Excel button navigates to the correct API URL', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: VALID_CLASS_UUID } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })

    fireEvent.click(screen.getByLabelText('Baixar relatório em Excel'))
    expect(window.location.href).toContain('format=xlsx')
  })

  it('clicking buttons when form is incomplete does not navigate', () => {
    render(<RelatoriosForm classes={mockClasses} />)
    // Only fill classId, leave dates empty
    fireEvent.change(screen.getByRole('combobox'), { target: { value: VALID_CLASS_UUID } })

    fireEvent.click(screen.getByLabelText('Baixar relatório em PDF'))
    expect(window.location.href).toBe('')
  })

  it('renders with empty classes list', () => {
    render(<RelatoriosForm classes={[]} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    // Only the default option
    expect(screen.getByText('Selecione uma turma')).toBeDefined()
  })
})
