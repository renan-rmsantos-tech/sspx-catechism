import type { UserRole } from '@/lib/supabase/types'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

const PUBLIC_PATHS = ['/', '/login']
const PROTECTED_PATHS = ['/admin', '/dashboard'] as const

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')))
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/**
 * Returns the redirect path for an unauthenticated user, or null if no redirect needed.
 * Public paths are accessible without authentication.
 */
export function getUnauthenticatedRedirect(pathname: string): string | null {
  if (isPublicPath(pathname)) return null
  return '/'
}

/**
 * Returns the redirect path when an authenticated user accesses the wrong role area, or null if allowed.
 * Authenticated users should not see the login screen (redirect to their home).
 * /admin is for coordinators only.
 * /dashboard is for catechists only.
 */
export function getRoleRedirect(pathname: string, role: UserRole): string | null {
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/')
  ) {
    return isCoordinatorOrAdmin(role) ? '/admin' : '/dashboard'
  }
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && !isCoordinatorOrAdmin(role)) {
    return '/dashboard'
  }
  if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && role !== 'catechist') {
    return '/admin'
  }
  return null
}
