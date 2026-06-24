import { apiFetch, ApiError, ApiUnauthorizedError, isUnauthorizedError } from '@/lib/api'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  })
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends same-origin cookies and serializes json bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const data = await apiFetch<{ ok: boolean }>('/api/example', {
      method: 'POST',
      json: { name: 'Teste' },
    })

    expect(data).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/example',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name: 'Teste' }),
      }),
    )
    expect(fetchMock.mock.calls[0][1].headers.get('content-type')).toBe('application/json')
  })

  it('throws a typed unauthorized error for 401 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ error: 'credenciais inválidas' }, { status: 401 }))
        .mockResolvedValueOnce(jsonResponse({ error: 'credenciais inválidas' }, { status: 401 })),
    )

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({
      name: 'ApiUnauthorizedError',
      status: 401,
      message: 'credenciais inválidas',
    })
    await expect(apiFetch('/api/auth/me')).rejects.toBeInstanceOf(ApiUnauthorizedError)
  })

  it('throws ApiError with server error messages for non-401 failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ error: 'sem permissão' }, { status: 403 }))
        .mockResolvedValueOnce(jsonResponse({ error: 'sem permissão' }, { status: 403 })),
    )

    await expect(apiFetch('/api/admin')).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch('/api/admin')).rejects.toMatchObject({
      status: 403,
      message: 'sem permissão',
    })
  })

  it('handles empty and non-json responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response('manutenção', {
          status: 503,
          headers: { 'content-type': 'text/plain' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/api/no-content')).resolves.toBeNull()
    await expect(apiFetch('/api/down')).rejects.toMatchObject({
      status: 503,
      message: 'manutenção',
    })
  })

  it('falls back to default messages and identifies unauthorized errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({}, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({
      message: 'sessão expirada',
    })
    await expect(apiFetch('/api/broken')).rejects.toMatchObject({
      message: 'erro ao comunicar com o servidor',
    })
    expect(isUnauthorizedError(new ApiUnauthorizedError())).toBe(true)
    expect(isUnauthorizedError(new ApiError(500, 'erro'))).toBe(false)
  })
})
