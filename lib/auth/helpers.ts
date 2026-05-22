import type { UserRole } from '@/lib/supabase/types'

export function isCoordinatorOrAdmin(role: string | null | undefined): boolean {
  return role === 'coordinator' || role === 'admin'
}

export function canManage(role: string | null | undefined): role is UserRole {
  return isCoordinatorOrAdmin(role)
}
