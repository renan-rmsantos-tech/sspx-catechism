import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Button } from './button'
import { Chip, NetworkChip } from './chip'
import { Field, Input, SearchField, Select, Textarea } from './field'
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
import { AuthShell } from '@/components/auth/auth-shell'

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

  it('renders a touch-sized search field with its icon inside the control', () => {
    render(<SearchField label="Buscar catequizandos" placeholder="Buscar por nome" />)
    const search = screen.getByRole('searchbox', { name: 'Buscar catequizandos' })
    expect(search).toHaveClass('min-h-touch', 'pl-10')
    expect(search.previousElementSibling).toHaveClass('absolute', 'left-3')
  })

  it('marks attendance with a touch-floor control', () => {
    const onMark = vi.fn()
    render(<AttendanceRow student={{ id: '1', name: 'Ana' }} mark={null} onMark={onMark} />)
    const yes = screen.getByRole('button', { name: 'Marcar Ana como presente' })
    expect(yes).toHaveClass('min-h-touch')
    fireEvent.click(yes)
    expect(onMark).toHaveBeenCalledWith(true)
  })

  it('uses the subtle attendance washes for present and absent rows', () => {
    const { rerender } = render(<AttendanceRow student={{ id: '1', name: 'Ana' }} mark onMark={vi.fn()} />)
    expect(screen.getByText('Ana').closest('[class*=bg-]')).toHaveClass('bg-accent-wash')
    rerender(<AttendanceRow student={{ id: '1', name: 'Ana' }} mark={false} onMark={vi.fn()} />)
    expect(screen.getByText('Ana').closest('[class*=bg-]')).toHaveClass('bg-danger-wash')
  })

  it('renders surface and selection primitives', () => {
    const onChange = vi.fn()
    render(<><Card variant="accent">Cartão</Card><Seg ariaLabel="Presença" value="yes" onValueChange={onChange} options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]} /><Choice legend="Comunhão" name="communion" onChange={onChange} options={[{ value: 'yes', label: 'Sim' }]} /><TableWrap><Table><tbody><tr><td>Valor</td></tr></tbody></Table></TableWrap></>)
    expect(screen.getByText('Cartão')).toHaveClass('bg-accent-soft')
    expect(screen.getByRole('cell', { name: 'Valor' })).not.toHaveClass('tabular-nums', 'text-right', 'whitespace-nowrap')
    expect(screen.getByRole('button', { name: 'Sim' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByLabelText('Sim'))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('applies tabular treatment only to declared numeric table columns', () => {
    render(<Table numericColumns={[1]}><thead><tr><th>Nome</th><th>Presenças</th></tr></thead><tbody><tr><td>Ana</td><td>12</td></tr></tbody></Table>)
    expect(screen.getByRole('columnheader', { name: 'Nome' })).not.toHaveClass('tabular-nums', 'text-right', 'whitespace-nowrap')
    expect(screen.getByRole('columnheader', { name: 'Presenças' })).toHaveClass('font-mono', 'tabular-nums', 'text-right', 'whitespace-nowrap')
    expect(screen.getByRole('cell', { name: '12' })).toHaveClass('font-mono', 'tabular-nums', 'text-right', 'whitespace-nowrap')
  })

  it('maps metrics dimensions and renders equal stepper rails with responsive mono labels', () => {
    render(<><StatCard value={86} unit="%" label="Presença" /><Meter percent={64} label="Meta" /><BarChart data={[{ label: 'Jan', value: 50 }]} max={100} /><ProgressRail done={2} total={4} /><Stepper current={1} steps={[{ label: 'Dados' }, { label: 'Contato' }]} /></>)
    expect(screen.getByTestId('meter-fill')).toHaveStyle({ width: '64%' })
    expect(screen.getByTestId('bar-0')).toHaveStyle({ height: '50%' })
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Contato')
    expect(screen.getByTestId('stepper-rail-0')).toHaveClass('h-1', 'bg-accent')
    expect(screen.getByTestId('stepper-rail-1')).toHaveClass('bg-[linear-gradient(90deg,var(--accent)_50%,var(--surface-3)_50%)]')
    expect(screen.getByText('Dados')).toHaveClass('hidden', 'min-[720px]:block', 'font-mono')
  })

  it('renders navigation, drawer, brand, and an actionable empty state', () => {
    render(<MemoryRouter><Sidebar groups={[{ label: 'Gestão', items: [{ label: 'Turmas', to: '/turmas', badge: 3 }] }]} /><Drawer open onOpenChange={vi.fn()} title="Inscrição">Conteúdo</Drawer><Brand /><EmptyState title="Nada aqui" description="Crie uma turma para começar." action={<Button>Nova turma</Button>} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Turmas/, hidden: true })).toHaveTextContent('3')
    expect(screen.getByRole('dialog')).toHaveTextContent('Conteúdo')
    expect(screen.getByLabelText('Catequese SSPX')).toBeInTheDocument()
    expect(screen.getByLabelText('Catequese SSPX').querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Crie uma turma para começar.')).toBeInTheDocument()
  })

  it('uses token-driven brand variants and the favicon form only below 20px', () => {
    const { rerender } = render(<Brand onInk />)
    const brand = screen.getByLabelText('Catequese SSPX')
    expect(brand).toHaveClass('text-surface', '[--mk-field:var(--accent-ink)]')
    expect(brand.querySelector('svg path[fill="currentColor"]')).toBeInTheDocument()
    expect(brand.querySelector('img')).not.toBeInTheDocument()
    rerender(<Brand markHeight={16} />)
    expect(screen.getByLabelText('Catequese SSPX').querySelector('img')).toHaveAttribute('src', '/favicon.svg')
  })

  it('renders the auth shell with its token gradient and without image filters', () => {
    render(<AuthShell title="Entrar">Conteúdo</AuthShell>)
    const aside = document.querySelector('aside')
    expect(aside).toHaveClass('bg-[image:var(--auth-aside-gradient)]')
    expect(aside?.className).not.toMatch(/filter|brightness|invert/)
    expect(aside?.querySelector('img')).not.toBeInTheDocument()
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
