import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

const user = {
  id: 'cat-1',
  email: 'tereza@example.com',
  fullName: 'Tereza Andrade',
  role: 'catechist',
  mustChangePassword: false,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function Probe() {
  const { user: current, isLoading } = useAuth()
  if (isLoading) return <p>carregando</p>
  return <p data-testid="probe">{current ? current.fullName : 'sem sessão'}</p>
}

describe('AuthProvider', () => {
  afterEach(() => vi.restoreAllMocks())

  // Sem isso a SPA segue se achando autenticada depois que o servidor recusa,
  // e o caminho de volta ao login não funciona
  // (BUG-20260727-sessao-expirada-preso-no-dashboard).
  it('derruba a sessão local quando qualquer chamada devolve 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input)
        if (path === '/api/auth/me') return jsonResponse(user)
        return jsonResponse({ error: 'não autenticado' }, 401)
      }),
    )

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('Tereza Andrade'))

    await expect(apiFetch('/api/attendance', { method: 'POST', json: {} })).rejects.toThrow()

    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('sem sessão'))
  })
})
