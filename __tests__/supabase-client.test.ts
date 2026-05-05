import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockReturnValue({ auth: {}, from: vi.fn() }),
  createServerClient: vi.fn().mockReturnValue({ auth: { getUser: vi.fn() }, from: vi.fn() }),
}))

const mockCookiesStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookiesStore),
}))

const mockNextResponse = {
  cookies: { set: vi.fn() },
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn().mockReturnValue(mockNextResponse),
  },
}))

const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SECRET_KEY = 'test-sb-secret-key'
  vi.clearAllMocks()
  mockCookiesStore.getAll.mockReturnValue([])
  mockCookiesStore.set.mockReset()
})

afterEach(() => {
  process.env = { ...originalEnv }
})

// --- config ---

describe('getPublicEnv', () => {
  it('returns url and anonKey when env vars are set', async () => {
    vi.resetModules()
    const { getPublicEnv } = await import('../lib/supabase/config')
    const result = getPublicEnv()
    expect(result.url).toBe('https://test.supabase.co')
    expect(result.anonKey).toBe('test-anon-key')
  })

  it('throws descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { getPublicEnv } = await import('../lib/supabase/config')
    expect(() => getPublicEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('throws descriptive error when both public keys are missing', async () => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const { getPublicEnv } = await import('../lib/supabase/config')
    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })

  it('prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY over anon when both are set', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xyz'
    const { getPublicEnv } = await import('../lib/supabase/config')
    expect(getPublicEnv().anonKey).toBe('sb_publishable_xyz')
  })
})

describe('getSupabaseSecretKey', () => {
  it('returns SUPABASE_SECRET_KEY when set', async () => {
    vi.resetModules()
    const { getSupabaseSecretKey } = await import('../lib/supabase/config')
    expect(getSupabaseSecretKey()).toBe('test-sb-secret-key')
  })

  it('falls back to legacy SUPABASE_SERVICE_ROLE_KEY when secret key is absent', async () => {
    vi.resetModules()
    delete process.env.SUPABASE_SECRET_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy-jwt'
    const { getSupabaseSecretKey } = await import('../lib/supabase/config')
    expect(getSupabaseSecretKey()).toBe('legacy-jwt')
  })

  it('prefers SUPABASE_SECRET_KEY over SUPABASE_SERVICE_ROLE_KEY when both are set', async () => {
    vi.resetModules()
    process.env.SUPABASE_SECRET_KEY = 'preferred'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'ignored'
    const { getSupabaseSecretKey } = await import('../lib/supabase/config')
    expect(getSupabaseSecretKey()).toBe('preferred')
  })

  it('throws descriptive error when both secret env vars are missing', async () => {
    vi.resetModules()
    delete process.env.SUPABASE_SECRET_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { getSupabaseSecretKey } = await import('../lib/supabase/config')
    expect(() => getSupabaseSecretKey()).toThrow(/SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY/)
  })
})

describe('getServiceRoleKey', () => {
  it('delegates to getSupabaseSecretKey', async () => {
    vi.resetModules()
    const { getServiceRoleKey } = await import('../lib/supabase/config')
    expect(getServiceRoleKey()).toBe('test-sb-secret-key')
  })
})

// --- browser client ---

describe('createSupabaseBrowserClient', () => {
  it('returns a valid Supabase client instance', async () => {
    vi.resetModules()
    const { createSupabaseBrowserClient } = await import('../lib/supabase/client')
    const client = createSupabaseBrowserClient()
    expect(client).toBeDefined()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('from')
  })

  it('calls createBrowserClient with correct env vars', async () => {
    vi.resetModules()
    const { createBrowserClient } = await import('@supabase/ssr')
    const { createSupabaseBrowserClient } = await import('../lib/supabase/client')
    createSupabaseBrowserClient()
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })
})

// --- server client ---

describe('createSupabaseServerClient', () => {
  it('returns a valid Supabase client instance', async () => {
    vi.resetModules()
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    const client = await createSupabaseServerClient()
    expect(client).toBeDefined()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('from')
  })

  it('calls createServerClient with correct url and anonKey', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    await createSupabaseServerClient()
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
  })

  it('cookies.getAll returns all cookies from the store', async () => {
    vi.resetModules()
    mockCookiesStore.getAll.mockReturnValue([{ name: 'sb-token', value: 'abc' }])
    const { createServerClient } = await import('@supabase/ssr')
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    await createSupabaseServerClient()
    const cookiesArg = (createServerClient as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]?.cookies
    const result = cookiesArg?.getAll()
    expect(result).toEqual([{ name: 'sb-token', value: 'abc' }])
  })

  it('cookies.setAll forwards each cookie to cookieStore.set', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    await createSupabaseServerClient()
    const cookiesArg = (createServerClient as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]?.cookies
    cookiesArg?.setAll([{ name: 'auth-token', value: 'xyz', options: { path: '/' } }])
    expect(mockCookiesStore.set).toHaveBeenCalledWith('auth-token', 'xyz', { path: '/' })
  })
})

// --- proxy middleware utility ---

describe('updateSession', () => {
  it('returns a NextResponse', async () => {
    vi.resetModules()
    const { updateSession } = await import('../lib/supabase/middleware')
    const mockRequest = {
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as import('next/server').NextRequest
    const response = await updateSession(mockRequest)
    expect(response).toBeDefined()
    expect(response).toHaveProperty('cookies')
  })

  it('calls supabase.auth.getUser to refresh the session', async () => {
    vi.resetModules()
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      auth: { getUser: mockGetUser },
      from: vi.fn(),
    })
    const { updateSession } = await import('../lib/supabase/middleware')
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: vi.fn() },
    } as unknown as import('next/server').NextRequest
    await updateSession(mockRequest)
    expect(mockGetUser).toHaveBeenCalled()
  })

  it('cookies.getAll returns cookies from the request object', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    const { updateSession } = await import('../lib/supabase/middleware')
    const mockGetAll = vi.fn().mockReturnValue([{ name: 'token', value: 'abc' }])
    const mockRequest = {
      cookies: { getAll: mockGetAll, set: vi.fn() },
    } as unknown as import('next/server').NextRequest
    await updateSession(mockRequest)
    const cookiesArg = (createServerClient as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]?.cookies
    const result = cookiesArg?.getAll()
    expect(mockGetAll).toHaveBeenCalled()
    expect(result).toEqual([{ name: 'token', value: 'abc' }])
  })

  it('cookies.setAll sets cookies on request and new response', async () => {
    vi.resetModules()
    const { NextResponse } = await import('next/server')
    const { createServerClient } = await import('@supabase/ssr')
    const { updateSession } = await import('../lib/supabase/middleware')
    const mockRequestSet = vi.fn()
    const mockResponseSet = vi.fn()
    ;(NextResponse.next as ReturnType<typeof vi.fn>).mockReturnValue({ cookies: { set: mockResponseSet } })
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: mockRequestSet },
    } as unknown as import('next/server').NextRequest
    await updateSession(mockRequest)
    const cookiesArg = (createServerClient as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]?.cookies
    cookiesArg?.setAll([{ name: 'auth', value: 'xyz', options: { path: '/' } }])
    expect(mockRequestSet).toHaveBeenCalledWith('auth', 'xyz')
    expect(mockResponseSet).toHaveBeenCalledWith('auth', 'xyz', { path: '/' })
  })
})
