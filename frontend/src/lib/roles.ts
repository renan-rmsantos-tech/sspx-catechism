import type { UserRole } from '@/types/auth'

export function isCoordinatorOrAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'coordinator'
}

export function roleHome(role: UserRole): string {
  return isCoordinatorOrAdmin(role) ? '/admin' : '/dashboard'
}
