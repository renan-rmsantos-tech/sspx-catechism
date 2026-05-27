// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from '@/app/admin/layout'
import DashboardLayout from '@/app/dashboard/layout'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin'),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 0 }),
      }),
    }),
  }),
}))

describe('AdminLayout', () => {
  async function renderAdminLayout(children: React.ReactNode) {
    const jsx = await AdminLayout({ children })
    render(jsx)
  }

  it('renders children inside main', async () => {
    await renderAdminLayout(<div>Page Content</div>)
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders the sidebar component (desktop layout)', async () => {
    await renderAdminLayout(<div>Content</div>)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('sidebar has hidden class (hidden on mobile, shown on lg+)', async () => {
    await renderAdminLayout(<div>Content</div>)
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('hidden')
    expect(sidebar).toHaveClass('lg:flex')
  })

  it('admin layout does not contain dashboard-header', async () => {
    await renderAdminLayout(<div>Content</div>)
    expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument()
  })
})

describe('DashboardLayout', () => {
  it('renders children', () => {
    render(
      <DashboardLayout>
        <div>Minhas Turmas</div>
      </DashboardLayout>
    )
    expect(screen.getByText('Minhas Turmas')).toBeInTheDocument()
  })

  it('does not render its own header (header lives in the page)', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    // The layout is a thin wrapper — page-level header is rendered by each page
    expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('does not render a sidebar (mobile-first, no sidebar)', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('dashboard layout has mobile-first flex-col structure', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    const layout = screen.getByTestId('dashboard-layout')
    expect(layout).toHaveClass('flex-col')
  })
})
