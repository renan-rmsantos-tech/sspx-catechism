import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/contexts/auth-context'
import { ApiError } from '@/lib/api'
import { getPendingSessionCount } from '@/lib/attendance-sync'
import { CHANGE_PASSWORD_PATH } from '@/lib/auth-routing'
import { roleHome } from '@/lib/roles'

export function friendlyLoginError(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return 'Muitas tentativas. Aguarde um minuto e tente novamente.'
  }
  return err instanceof ApiError ? err.message : 'Não foi possível entrar.'
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Quem chega aqui com chamada na fila (sessão expirada) precisa saber que o
  // trabalho não se perdeu (BUG-20260727-sessao-expirada-preso-no-dashboard).
  const [pendingAttendance, setPendingAttendance] = useState(0)

  useEffect(() => {
    let active = true
    void getPendingSessionCount()
      .then((count) => active && setPendingAttendance(count))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(email: string, password: string) {
    setError(null)
    setIsSubmitting(true)
    try {
      const user = await login(email, password)
      navigate(user.mustChangePassword ? CHANGE_PASSWORD_PATH : roleHome(user.role), {
        replace: true,
      })
    } catch (err) {
      setError(friendlyLoginError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoginForm
      error={error}
      isSubmitting={isSubmitting}
      pendingAttendance={pendingAttendance}
      onSubmit={(email, password) => void handleSubmit(email, password)}
    />
  )
}
