// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/alunos',
  useSearchParams: () => new URLSearchParams(),
}))

import StudentSearch from '@/components/admin/student-search'

describe('StudentSearch', () => {
  it('renders a search input', () => {
    render(<StudentSearch />)
    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
  })

  it('has correct placeholder text', () => {
    render(<StudentSearch />)
    expect(screen.getByPlaceholderText('Buscar aluno por nome...')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<StudentSearch />)
    expect(screen.getByLabelText('Buscar aluno por nome')).toBeInTheDocument()
  })

  it('renders with empty default value when no q param', () => {
    render(<StudentSearch />)
    const input = screen.getByRole('searchbox') as HTMLInputElement
    expect(input.value).toBe('')
  })
})
