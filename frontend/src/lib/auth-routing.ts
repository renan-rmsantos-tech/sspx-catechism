import { isCoordinatorOrAdmin, roleHome } from '@/lib/roles'
import type { AuthUser, UserRole } from '@/types/auth'

export const CHANGE_PASSWORD_PATH = '/trocar-senha'
export const LOGIN_PATH = '/login'

const PUBLIC_PATHS = ['/', LOGIN_PATH, '/inscricao'] as const
const ADMIN_PREFIX = '/admin'
const DASHBOARD_PREFIX = '/dashboard'

function matchesPath(pathname: string, base: string): boolean {
  return pathname === base || (base !== '/' && pathname.startsWith(`${base}/`))
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => matchesPath(pathname, path))
}

export function isProtectedPath(pathname: string): boolean {
  return (
    matchesPath(pathname, ADMIN_PREFIX) ||
    matchesPath(pathname, DASHBOARD_PREFIX) ||
    matchesPath(pathname, CHANGE_PASSWORD_PATH)
  )
}

export function getRoleRedirect(pathname: string, role: UserRole): string | null {
  if (matchesPath(pathname, ADMIN_PREFIX) && !isCoordinatorOrAdmin(role)) {
    return DASHBOARD_PREFIX
  }
  if (matchesPath(pathname, DASHBOARD_PREFIX) && role !== 'catechist') {
    return ADMIN_PREFIX
  }
  return null
}

export function getAuthRedirect(pathname: string, user: AuthUser | null): string | null {
  if (!user) {
    return isProtectedPath(pathname) ? LOGIN_PATH : null
  }

  if (user.mustChangePassword && !matchesPath(pathname, CHANGE_PASSWORD_PATH)) {
    return CHANGE_PASSWORD_PATH
  }

  if (!user.mustChangePassword && matchesPath(pathname, CHANGE_PASSWORD_PATH)) {
    return roleHome(user.role)
  }

  if (matchesPath(pathname, '/') || matchesPath(pathname, LOGIN_PATH)) {
    return roleHome(user.role)
  }

  return getRoleRedirect(pathname, user.role)
}
