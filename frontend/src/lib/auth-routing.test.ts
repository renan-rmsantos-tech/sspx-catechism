import {
  CHANGE_PASSWORD_PATH,
  getAuthRedirect,
  getRoleRedirect,
  isProtectedPath,
  isPublicPath,
} from '@/lib/auth-routing'
import type { AuthUser } from '@/types/auth'

const coordinator: AuthUser = {
  id: '1',
  email: 'coord@example.com',
  fullName: 'Coord',
  role: 'coordinator',
  mustChangePassword: false,
}

const catechist: AuthUser = {
  id: '2',
  email: 'cat@example.com',
  fullName: 'Cat',
  role: 'catechist',
  mustChangePassword: false,
}

describe('auth routing', () => {
  it('classifies public and protected paths', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/inscricao')).toBe(true)
    expect(isProtectedPath('/admin/turmas')).toBe(true)
    expect(isProtectedPath('/dashboard/turmas/1')).toBe(true)
    expect(isProtectedPath(CHANGE_PASSWORD_PATH)).toBe(true)
  })

  it('redirects unauthenticated users away from protected routes', () => {
    expect(getAuthRedirect('/admin', null)).toBe('/login')
    expect(getAuthRedirect('/dashboard', null)).toBe('/login')
    expect(getAuthRedirect('/login', null)).toBeNull()
  })

  it('redirects authenticated users to their role home', () => {
    expect(getAuthRedirect('/login', coordinator)).toBe('/admin')
    expect(getAuthRedirect('/', catechist)).toBe('/dashboard')
    expect(getRoleRedirect('/admin', catechist.role)).toBe('/dashboard')
    expect(getRoleRedirect('/dashboard', coordinator.role)).toBe('/admin')
  })

  it('forces mustChangePassword users to the password-change route', () => {
    const user = { ...catechist, mustChangePassword: true }

    expect(getAuthRedirect('/dashboard', user)).toBe(CHANGE_PASSWORD_PATH)
    expect(getAuthRedirect('/admin', user)).toBe(CHANGE_PASSWORD_PATH)
    expect(getAuthRedirect(CHANGE_PASSWORD_PATH, user)).toBeNull()
  })

  it('keeps users who already changed password out of the password-change route', () => {
    expect(getAuthRedirect(CHANGE_PASSWORD_PATH, coordinator)).toBe('/admin')
  })
})
