import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Button } from './button'
import { Chip, NetworkChip } from './chip'
import { Field, Input, Select, Textarea } from './field'
import { Card } from './card'
import { AttendanceRow } from './attendance-row'
import { Seg } from './seg'
import { Choice } from './choice'
import { Table, TableWrap } from './table'
import { BarChart, Meter, ProgressRail, StatCard } from './metrics'
import { EmptyState } from './empty-state'
import { Stepper } from './stepper'
import { Sidebar } from './sidebar'
import { Drawer } from './drawer'
import { Brand } from './brand'

vi.mock('@/lib/attendance-sync', () => ({ getPendingSessionCount: vi.fn().mockResolvedValue(2) }))

describe('anchor components', () => {
  it('renders button reasons and token variants', () => {
    render(<><Button disabled disabledReason="Faltam 4">Confirmar</Button><Button variant="danger">Excluir</Button></>)
    expect(screen.getByRole('button', { name: 'Faltam 4' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveClass('border-danger')
  })

  it('renders state chips and the queue-aware network state', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    render(<><Chip tone="ok">Ativo</Chip><Chip tone="warn">Pendente</Chip><Chip tone="danger">Ausente</Chip><Chip tone="info">Aviso</Chip><Chip tone="gold">Renovação</Chip><NetworkChip /></>)
    expect(screen.getByText('Ativo')).toHaveClass('bg-accent-soft')
    expect(screen.getByText('Pendente')).toHaveClass('bg-warn-soft')
    expect(screen.getByText('Ausente')).toHaveClass('bg-danger-soft')
    expect(screen.getByText('Aviso')).toHaveClass('bg-info-soft')
    expect(screen.getByText('Renovação')).toHaveClass('bg-gold-soft')
    await waitFor(() => expect(screen.getByText(/Offline/)).toHaveTextContent('2'))
  })

  it('renders field help and errors', () => {
    render(<><Field id="nome" label="Nome" hint="Como consta no registro"><Input id="nome" /></Field><Field id="turma" label="Turma" error="Escolha uma turma"><Select id="turma"><option>A</option></Select></Field><Textarea aria-label="Observação" /></>)
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Como consta no registro')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma turma')
  })

  it('marks attendance with a touch-floor control', () => {
    const onMark = vi.fn()
    render(<AttendanceRow student={{ id: '1', name: 'Ana' }} mark={null} onMark={onMark} />)
    const yes = screen.getByRole('button', { name: 'Marcar Ana como presente' })
    expect(yes).toHaveClass('min-h-touch')
    fireEvent.click(yes)
    expect(onMark).toHaveBeenCalledWith(true)
  })

  it('renders surface and selection primitives', () => {
    const onChange = vi.fn()
    render(<><Card variant="accent">Cartão</Card><Seg ariaLabel="Presença" value="yes" onValueChange={onChange} options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]} /><Choice legend="Comunhão" name="communion" onChange={onChange} options={[{ value: 'yes', label: 'Sim' }]} /><TableWrap><Table><tbody><tr><td>Valor</td></tr></tbody></Table></TableWrap></>)
    expect(screen.getByText('Cartão')).toHaveClass('bg-accent-soft')
    expect(screen.getByRole('button', { name: 'Sim' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByLabelText('Sim'))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('maps metrics dimensions and marks the current step', () => {
    render(<><StatCard value={86} unit="%" label="Presença" /><Meter percent={64} label="Meta" /><BarChart data={[{ label: 'Jan', value: 50 }]} max={100} /><ProgressRail done={2} total={4} /><Stepper current={1} steps={[{ label: 'Dados' }, { label: 'Contato' }]} /></>)
    expect(screen.getByTestId('meter-fill')).toHaveStyle({ width: '64%' })
    expect(screen.getByTestId('bar-0')).toHaveStyle({ height: '50%' })
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Contato')
  })

  it('renders navigation, drawer, brand, and an actionable empty state', () => {
    render(<MemoryRouter><Sidebar groups={[{ label: 'Gestão', items: [{ label: 'Turmas', to: '/turmas', badge: 3 }] }]} /><Drawer open onOpenChange={vi.fn()} title="Inscrição">Conteúdo</Drawer><Brand /><EmptyState title="Nada aqui" description="Crie uma turma para começar." action={<Button>Nova turma</Button>} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Turmas/, hidden: true })).toHaveTextContent('3')
    expect(screen.getByRole('dialog')).toHaveTextContent('Conteúdo')
    expect(screen.getByLabelText('Catequese SSPX')).toBeInTheDocument()
    expect(screen.getByText('Crie uma turma para começar.')).toBeInTheDocument()
  })

  it('keeps keyboard focus visible on every interactive primitive', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const outlineNone = ['outline', 'none'].join('-')
    const suppressedFocusClasses = [outlineNone, `focus:${outlineNone}`, `focus-visible:${outlineNone}`]
    const { unmount } = render(<MemoryRouter><Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="ghost">Fantasma</Button><Button variant="danger">Perigo</Button><Input aria-label="Nome" /><Select aria-label="Turma"><option>A</option></Select><Textarea aria-label="Observação" /><AttendanceRow student={{ id: '1', name: 'Ana' }} mark={null} onMark={vi.fn()} /><Seg ariaLabel="Presença" value={null} onValueChange={onChange} options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]} /><Choice legend="Comunhão" name="communion" onChange={onChange} options={[{ value: 'yes', label: 'Sim' }]} /><Sidebar groups={[{ label: 'Gestão', items: [{ label: 'Turmas', to: '/turmas' }] }]} /></MemoryRouter>)

    const controls = Array.from(document.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]'))
    expect(controls).not.toHaveLength(0)
    for (const control of controls) {
      for (const className of control.className.split(' ')) expect(suppressedFocusClasses).not.toContain(className)
    }

    await user.tab()
    expect(controls).toContain(document.activeElement)
    expect(screen.getByLabelText('Nome')).toHaveClass('focus:border-accent', 'focus:shadow-[var(--focus-field-ring)]')
    expect(screen.getByLabelText('Turma')).toHaveClass('focus:border-accent', 'focus:shadow-[var(--focus-field-ring)]')
    expect(screen.getByLabelText('Observação')).toHaveClass('focus:border-accent', 'focus:shadow-[var(--focus-field-ring)]')
    const navigationItem = screen.getByRole('link', { name: 'Turmas' })
    for (let index = 0; index < 12; index += 1) await user.tab()
    expect(navigationItem).toHaveFocus()

    unmount()
    render(<Drawer open onOpenChange={vi.fn()} title="Inscrição">Conteúdo</Drawer>)
    const closeDrawer = screen.getByRole('button', { name: 'Fechar' })
    closeDrawer.focus()
    expect(closeDrawer).toHaveFocus()
  })
})
