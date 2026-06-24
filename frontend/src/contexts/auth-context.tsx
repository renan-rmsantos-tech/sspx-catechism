import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '@/lib/auth-api'
import { isUnauthorizedError } from '@/lib/api'
import type { AuthUser } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  changePassword: (newPassword: string) => Promise<AuthUser>
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await authApi.fetchCurrentUser()
      setUser(nextUser)
      return nextUser
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setUser(null)
        return null
      }
      throw error
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    refreshUser()
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password)
      const nextUser = await refreshUser()
      if (!nextUser) throw new Error('não foi possível carregar a sessão')
      return nextUser
    },
    [refreshUser],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const changePassword = useCallback(
    async (newPassword: string) => {
      await authApi.changePassword(newPassword)
      const nextUser = await refreshUser()
      if (!nextUser) throw new Error('não foi possível atualizar a sessão')
      return nextUser
    },
    [refreshUser],
  )

  const value = useMemo(
    () => ({ user, isLoading, login, logout, changePassword, refreshUser }),
    [user, isLoading, login, logout, changePassword, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
