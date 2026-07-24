import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

const adminUser = {
  id: '1',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'admin',
  mustChangePassword: false,
}

const catechistMustChange = {
  id: '2',
  email: 'catequista@example.com',
  fullName: 'Catequista',
  role: 'catechist',
  mustChangePassword: true,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App auth flow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs in with the API cookie flow and navigates to the role area', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'sessão expirada' }, 401))
      .mockResolvedValueOnce(jsonResponse({ role: 'admin', mustChangePassword: false }))
      .mockResolvedValueOnce(jsonResponse(adminUser))
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/login')

    await screen.findByRole('heading', { name: 'Entrar' })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await screen.findByRole('heading', { name: 'Administração' })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: 'admin@example.com',
      password: 'secret123',
    })
  })

  it('forces mustChangePassword users to change their password before dashboard access', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(catechistMustChange)))

    renderAt('/dashboard')

    await screen.findByRole('heading', { name: 'Trocar senha' })
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('submits password changes and returns to the role area', async () => {
    const changedUser = { ...catechistMustChange, mustChangePassword: false }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(catechistMustChange))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }))
      .mockResolvedValueOnce(jsonResponse(changedUser))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/trocar-senha')

    await screen.findByRole('heading', { name: 'Trocar senha' })
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'nova123' },
    })
    fireEvent.change(screen.getByLabelText('Repetir a nova senha'), {
      target: { value: 'nova123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await screen.findByText('Nenhuma turma atribuída.')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6))
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/auth/change-password',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })

  it('validates login and password-change forms before calling the API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'sessão expirada' }, 401))
      .mockResolvedValueOnce(jsonResponse(catechistMustChange))
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/login')

    await screen.findByRole('heading', { name: 'Entrar' })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe e-mail e senha.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows password rules live and only enables submission once every rule is met', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(catechistMustChange))
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/trocar-senha')

    await screen.findByRole('heading', { name: 'Trocar senha' })
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'nova123' },
    })
    expect(screen.getByText('Pelo menos 6 caracteres').closest('li')).toHaveClass('text-accent-ink')
    expect(screen.getByText('Uma letra e um número').closest('li')).toHaveClass('text-accent-ink')
    expect(screen.getByText('As duas senhas coincidem').closest('li')).toHaveClass('text-muted-foreground')
    expect(screen.getByRole('button', { name: 'Faltam 1' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Repetir a nova senha'), {
      target: { value: 'nova123' },
    })
    expect(screen.getByText('As duas senhas coincidem').closest('li')).toHaveClass('text-accent-ink')
    expect(screen.getByRole('button', { name: /salvar nova senha/i })).toBeEnabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows API errors in the auth error treatment', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'sessão expirada' }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: 'E-mail ou senha incorretos.' }, 401))
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/login')

    await screen.findByRole('heading', { name: 'Entrar' })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'incorreta' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('renders the institutional brand and only one primary action on each auth screen', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'sessão expirada' }, 401))
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderAt('/login')
    await screen.findByRole('heading', { name: 'Entrar' })
    expect(screen.getByLabelText('Catequese SSPX')).toBeInTheDocument()
    expect(document.querySelectorAll('button.bg-accent')).toHaveLength(1)
    unmount()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(catechistMustChange)))
    renderAt('/trocar-senha')
    await screen.findByRole('heading', { name: 'Trocar senha' })
    expect(screen.getByLabelText('Catequese SSPX')).toBeInTheDocument()
    expect(document.querySelectorAll('button.bg-accent')).toHaveLength(1)
  })
})
