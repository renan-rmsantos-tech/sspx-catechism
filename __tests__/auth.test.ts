import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// Unit Tests — Zod login schema
// ============================================================

describe('loginSchema — e-mail validation', () => {
  it('rejects an invalid e-mail address', async () => {
    const { loginSchema } = await import('../lib/auth/schemas')
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailError).toBeDefined()
    }
  })

  it('rejects an empty e-mail', async () => {
    const { loginSchema } = await import('../lib/auth/schemas')
    const result = loginSchema.safeParse({ email: '', password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid e-mail', async () => {
    const { loginSchema } = await import('../lib/auth/schemas')
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' })
    expect(result.success).toBe(true)
  })
})

describe('loginSchema — password validation', () => {
  it('rejects an empty password', async () => {
    const { loginSchema } = await import('../lib/auth/schemas')
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path[0] === 'password')
      expect(passwordError).toBeDefined()
    }
  })

  it('accepts a non-empty password', async () => {
    const { loginSchema } = await import('../lib/auth/schemas')
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anypass' })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// Unit Tests — routing logic
// ============================================================

describe('isPublicPath', () => {
  it('returns true for /login', async () => {
    const { isPublicPath } = await import('../lib/auth/routing')
    expect(isPublicPath('/login')).toBe(true)
  })

  it('returns true for /login/sub', async () => {
    const { isPublicPath } = await import('../lib/auth/routing')
    expect(isPublicPath('/login/sub')).toBe(true)
  })

  it('returns false for /admin', async () => {
    const { isPublicPath } = await import('../lib/auth/routing')
    expect(isPublicPath('/admin')).toBe(false)
  })

  it('returns false for /dashboard', async () => {
    const { isPublicPath } = await import('../lib/auth/routing')
    expect(isPublicPath('/dashboard')).toBe(false)
  })
})

describe('isProtectedPath', () => {
  it('returns true for /admin', async () => {
    const { isProtectedPath } = await import('../lib/auth/routing')
    expect(isProtectedPath('/admin')).toBe(true)
  })

  it('returns true for /dashboard', async () => {
    const { isProtectedPath } = await import('../lib/auth/routing')
    expect(isProtectedPath('/dashboard')).toBe(true)
  })

  it('returns true for /admin/users', async () => {
    const { isProtectedPath } = await import('../lib/auth/routing')
    expect(isProtectedPath('/admin/users')).toBe(true)
  })

  it('returns false for /login', async () => {
    const { isProtectedPath } = await import('../lib/auth/routing')
    expect(isProtectedPath('/login')).toBe(false)
  })
})

describe('getUnauthenticatedRedirect', () => {
  it('returns null for /login (public path)', async () => {
    const { getUnauthenticatedRedirect } = await import('../lib/auth/routing')
    expect(getUnauthenticatedRedirect('/login')).toBeNull()
  })

  it('redirects to /login for /admin (protected path)', async () => {
    const { getUnauthenticatedRedirect } = await import('../lib/auth/routing')
    expect(getUnauthenticatedRedirect('/admin')).toBe('/login')
  })

  it('redirects to /login for /dashboard (protected path)', async () => {
    const { getUnauthenticatedRedirect } = await import('../lib/auth/routing')
    expect(getUnauthenticatedRedirect('/dashboard')).toBe('/login')
  })

  it('redirects to /login for /dashboard/turma/123', async () => {
    const { getUnauthenticatedRedirect } = await import('../lib/auth/routing')
    expect(getUnauthenticatedRedirect('/dashboard/turma/123')).toBe('/login')
  })

  it('redirects to /login for any unknown path', async () => {
    const { getUnauthenticatedRedirect } = await import('../lib/auth/routing')
    expect(getUnauthenticatedRedirect('/settings')).toBe('/login')
  })
})

describe('getRoleRedirect — catechist', () => {
  it('redirects catechist on /login to /dashboard', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/login', 'catechist')).toBe('/dashboard')
  })

  it('redirects catechist attempting /admin to /dashboard', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/admin', 'catechist')).toBe('/dashboard')
  })

  it('redirects catechist attempting /admin/users to /dashboard', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/admin/users', 'catechist')).toBe('/dashboard')
  })

  it('returns null for catechist on /dashboard (allowed)', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/dashboard', 'catechist')).toBeNull()
  })

  it('returns null for catechist on /dashboard/turma/1 (allowed)', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/dashboard/turma/1', 'catechist')).toBeNull()
  })
})

describe('getRoleRedirect — coordinator', () => {
  it('redirects coordinator on /login to /admin', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/login', 'coordinator')).toBe('/admin')
  })

  it('redirects coordinator attempting /dashboard to /admin', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/dashboard', 'coordinator')).toBe('/admin')
  })

  it('redirects coordinator attempting /dashboard/turma/1 to /admin', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/dashboard/turma/1', 'coordinator')).toBe('/admin')
  })

  it('returns null for coordinator on /admin (allowed)', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/admin', 'coordinator')).toBeNull()
  })

  it('returns null for coordinator on /admin/users (allowed)', async () => {
    const { getRoleRedirect } = await import('../lib/auth/routing')
    expect(getRoleRedirect('/admin/users', 'coordinator')).toBeNull()
  })
})

// ============================================================
// Unit Tests — getProxyUser (lib/supabase/middleware.ts)
// ============================================================

const mockNextResponseProxy = {
  cookies: { set: vi.fn(), getAll: vi.fn().mockReturnValue([]) },
}

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn().mockReturnValue(mockNextResponseProxy),
    redirect: vi.fn((url: URL) => ({ redirected: true, url: url.toString() })),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), set: vi.fn() }),
}))

const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  vi.clearAllMocks()
  ;(mockNextResponseProxy.cookies.set as ReturnType<typeof vi.fn>).mockReset()
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('getProxyUser', () => {
  it('returns user null when no session', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    })
    const { getProxyUser } = await import('../lib/supabase/middleware')
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: vi.fn() },
    } as unknown as import('next/server').NextRequest
    const result = await getProxyUser(mockRequest)
    expect(result.user).toBeNull()
    expect(result.response).toBeDefined()
  })

  it('returns authenticated user when session is active', async () => {
    vi.resetModules()
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(),
    })
    const { getProxyUser } = await import('../lib/supabase/middleware')
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: vi.fn() },
    } as unknown as import('next/server').NextRequest
    const result = await getProxyUser(mockRequest)
    expect(result.user).toEqual(mockUser)
  })

  it('calls createServerClient with the correct env vars', async () => {
    vi.resetModules()
    const { createServerClient } = await import('@supabase/ssr')
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    })
    const { getProxyUser } = await import('../lib/supabase/middleware')
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: vi.fn() },
    } as unknown as import('next/server').NextRequest
    await getProxyUser(mockRequest)
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
  })

  it('cookies.setAll sets cookies on request and new response', async () => {
    vi.resetModules()
    const { NextResponse } = await import('next/server')
    const { createServerClient } = await import('@supabase/ssr')
    const { getProxyUser } = await import('../lib/supabase/middleware')
    const mockRequestSet = vi.fn()
    const mockResponseSet = vi.fn()
    ;(NextResponse.next as ReturnType<typeof vi.fn>).mockReturnValue({
      cookies: { set: mockResponseSet, getAll: vi.fn().mockReturnValue([]) },
    })
    const mockRequest = {
      cookies: { getAll: vi.fn().mockReturnValue([]), set: mockRequestSet },
    } as unknown as import('next/server').NextRequest
    await getProxyUser(mockRequest)
    const cookiesArg = (createServerClient as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]?.cookies
    cookiesArg?.setAll([{ name: 'auth', value: 'xyz', options: { path: '/' } }])
    expect(mockRequestSet).toHaveBeenCalledWith('auth', 'xyz')
    expect(mockResponseSet).toHaveBeenCalledWith('auth', 'xyz', { path: '/' })
  })
})

// ============================================================
// Integration Tests — login/logout Server Actions (mocked)
// ============================================================

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

vi.mock('../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

function makeSupabaseMock(overrides: {
  signInError?: { message: string } | null
  user?: { id: string; email: string } | null
  profileRole?: string | null
} = {}) {
  const { signInError = null, user = null, profileRole = null } = overrides
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: signInError }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: profileRole ? { role: profileRole } : null }),
    }),
  }
}

describe('loginAction — integration (mocked Supabase)', () => {
  it('returns error message for invalid credentials', async () => {
    vi.resetModules()
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    ;(createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({ signInError: { message: 'Invalid login credentials' } })
    )
    const { loginAction } = await import('../app/(auth)/login/actions')
    const formData = new FormData()
    formData.set('email', 'wrong@test.com')
    formData.set('password', 'wrong')
    const result = await loginAction(null, formData)
    expect(result).toEqual({
      error: 'Credenciais inválidas. Verifique seu e-mail e senha.',
    })
  })

  it('redirects coordinator to /admin on successful login', async () => {
    vi.resetModules()
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    ;(createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: 'coord-1', email: 'coord@test.com' },
        profileRole: 'coordinator',
      })
    )
    const { loginAction } = await import('../app/(auth)/login/actions')
    const formData = new FormData()
    formData.set('email', 'coord@test.com')
    formData.set('password', 'pass')
    await expect(loginAction(null, formData)).rejects.toThrow('REDIRECT:/admin')
  })

  it('redirects catechist to /dashboard on successful login', async () => {
    vi.resetModules()
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    ;(createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock({
        user: { id: 'cat-1', email: 'cat@test.com' },
        profileRole: 'catechist',
      })
    )
    const { loginAction } = await import('../app/(auth)/login/actions')
    const formData = new FormData()
    formData.set('email', 'cat@test.com')
    formData.set('password', 'pass')
    await expect(loginAction(null, formData)).rejects.toThrow('REDIRECT:/dashboard')
  })
})

describe('logoutAction — integration (mocked Supabase)', () => {
  it('calls signOut and redirects to /login', async () => {
    vi.resetModules()
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    const { createSupabaseServerClient } = await import('../lib/supabase/server')
    ;(createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { signOut: mockSignOut },
    })
    const { logoutAction } = await import('../app/(auth)/login/actions')
    await expect(logoutAction()).rejects.toThrow('REDIRECT:/login')
    expect(mockSignOut).toHaveBeenCalled()
  })
})
