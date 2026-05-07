// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardHeader from '@/components/dashboard/dashboard-header'

vi.mock('@/app/(auth)/login/actions', () => ({
  logoutAction: vi.fn(),
}))

describe('DashboardHeader', () => {
  it('renders title and logout control', () => {
    render(<DashboardHeader />)
    expect(screen.getByText('Catequese')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
  })
})
