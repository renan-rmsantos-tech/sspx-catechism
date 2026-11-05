import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

interface LoginFormProps {
  /** Mensagem do servidor para a última tentativa. */
  error: string | null
  isSubmitting: boolean
  /** Chamadas guardadas no aparelho esperando uma sessão para serem enviadas. */
  pendingAttendance: number
  onSubmit: (email: string, password: string) => void
}

/** Tela de login sem sessão nem rede: `LoginPage` entra com as credenciais. */
export function LoginForm({ error, isSubmitting, pendingAttendance, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [missingFields, setMissingFields] = useState(false)
  const shownError = missingFields ? 'Informe e-mail e senha.' : error

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setMissingFields(true)
      return
    }
    setMissingFields(false)
    onSubmit(email, password)
  }

  return (
    <AuthShell title="Entrar" description="Use o e-mail cadastrado pela coordenação da paróquia.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {pendingAttendance > 0 && (
          <p
            role="status"
            className="rounded-[var(--r-sm)] bg-info-soft px-3 py-2 text-sm text-info-ink"
            data-testid="pending-attendance-notice"
          >
            {pendingAttendance === 1
              ? 'Sua chamada está guardada no aparelho. Entre para enviá-la.'
              : `Você tem ${pendingAttendance} chamadas guardadas no aparelho. Entre para enviá-las.`}
          </p>
        )}
        <Field id="email" label="E-mail">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={shownError && !email.trim() ? 'true' : undefined}
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
            aria-invalid={shownError && !password ? 'true' : undefined}
            placeholder="Mínimo de 6 caracteres"
          />
        </Field>

        {shownError ? (
          <p role="alert" className="rounded-[var(--r-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-ink">
            {shownError}
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
