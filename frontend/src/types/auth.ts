export type UserRole = 'admin' | 'coordinator' | 'catechist'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  mustChangePassword: boolean
}

export interface LoginResponse {
  role: UserRole
  mustChangePassword: boolean
}
