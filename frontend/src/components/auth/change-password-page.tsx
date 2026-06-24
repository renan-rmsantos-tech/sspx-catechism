import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { ApiError } from '@/lib/api'
import { roleHome } from '@/lib/roles'

export function ChangePasswordPage() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('As senhas não conferem.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await changePassword(password)
      navigate(roleHome(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível trocar a senha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Trocar senha"
      description="Crie uma nova senha antes de continuar usando o sistema."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm_password" className="text-sm font-medium text-foreground">
            Confirmar senha
          </label>
          <input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Repita a nova senha"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          <KeyRound aria-hidden="true" />
          {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  )
}
