import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useAuth } from '@/contexts/auth-context'
import { ApiError } from '@/lib/api'
import { CHANGE_PASSWORD_PATH } from '@/lib/auth-routing'
import { roleHome } from '@/lib/roles'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login(email, password)
      navigate(user.mustChangePassword ? CHANGE_PASSWORD_PATH : roleHome(user.role), {
        replace: true,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Entrar" description="Use o e-mail cadastrado pela coordenação da paróquia.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field id="email" label="E-mail">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error && !email.trim() ? 'true' : undefined}
            placeholder="catequista@paroquia.org"
          />
        </Field>

        <Field id="password" label="Senha" hint="No primeiro acesso você será levado à troca de senha.">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error && !password ? 'true' : undefined}
            placeholder="Mínimo de 6 caracteres"
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-[var(--r-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} disabledReason="Entrando..." className="mt-1 w-full">
          <LogIn aria-hidden="true" />
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
