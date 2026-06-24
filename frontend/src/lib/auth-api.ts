import { apiFetch } from '@/lib/api'
import type { AuthUser, LoginResponse } from '@/types/auth'

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me')
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  })
}

export function logout(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/api/auth/logout', { method: 'POST' })
}

export function changePassword(newPassword: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/api/auth/change-password', {
    method: 'POST',
    json: { newPassword },
  })
}
