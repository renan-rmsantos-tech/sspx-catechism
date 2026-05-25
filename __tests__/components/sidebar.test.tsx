// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
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

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/admin')
  })

  it('renders all nav items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Turmas')).toBeInTheDocument()
    expect(screen.getByText('Alunos')).toBeInTheDocument()
    expect(screen.getByText('Chamadas')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('marks the active item when pathname is /admin', () => {
    vi.mocked(usePathname).mockReturnValue('/admin')
    render(<Sidebar />)
    const activeLink = screen.getByText('Visão Geral').closest('a')
    expect(activeLink).toHaveClass('sidebar-nav-item-active')
    expect(activeLink).toHaveAttribute('data-active', 'true')
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('marks Alunos as active when pathname is /admin/alunos', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/alunos')
    render(<Sidebar />)
    const activeLink = screen.getByText('Alunos').closest('a')
    expect(activeLink).toHaveClass('sidebar-nav-item-active')
    expect(activeLink).toHaveAttribute('data-active', 'true')
  })

  it('does not mark Visão Geral as active when pathname is /admin/alunos', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/alunos')
    render(<Sidebar />)
    const inactiveLink = screen.getByText('Visão Geral').closest('a')
    expect(inactiveLink).not.toHaveClass('sidebar-nav-item-active')
    expect(inactiveLink).toHaveAttribute('data-active', 'false')
  })

  it('renders active item with amber accent background color', () => {
    vi.mocked(usePathname).mockReturnValue('/admin')
    render(<Sidebar />)
    const activeLink = screen.getByText('Visão Geral').closest('a')
    // Active item uses rgba(180,83,9,0.15) = --accent with opacity
    expect(activeLink).toHaveStyle({ backgroundColor: 'rgba(180, 83, 9, 0.15)' })
  })

  it('renders user section with user name and role', () => {
    render(<Sidebar userName="João Rocha" userRole="Coordenador" userInitials="JR" />)
    expect(screen.getByText('João Rocha')).toBeInTheDocument()
    expect(screen.getByText('Coordenador')).toBeInTheDocument()
    expect(screen.getByText('JR')).toBeInTheDocument()
  })

  it('uses defaults for user section when no props provided', () => {
    render(<Sidebar />)
    // Both userName and userRole default to 'Coordenador'
    expect(screen.getAllByText('Coordenador')).toHaveLength(2)
    expect(screen.getByText('CO')).toBeInTheDocument()
  })

  it('renders app name', () => {
    render(<Sidebar />)
    expect(screen.getByText('Catequese')).toBeInTheDocument()
  })

  it('marks Chamadas as active for /admin/chamadas sub-paths', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/chamadas/123')
    render(<Sidebar />)
    const activeLink = screen.getByText('Chamadas').closest('a')
    expect(activeLink).toHaveClass('sidebar-nav-item-active')
  })

  it('sidebar has the dark sidebar-bg background', () => {
    render(<Sidebar />)
    const aside = screen.getByTestId('sidebar')
    expect(aside).toHaveStyle({ backgroundColor: 'var(--sidebar-bg)' })
  })
})
