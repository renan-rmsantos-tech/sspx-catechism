import { useState, type FormEvent } from 'react'
import { Check, Circle, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/auth-shell'
import { passwordRules, passwordSchema } from '@/components/auth/password-rules'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
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
  const rules = passwordRules(password, confirmation)
  const allRulesComplete = rules.every((rule) => rule.complete)
  const disabledReason = isSubmitting ? 'Salvando...' : `Faltam ${rules.filter((rule) => !rule.complete).length}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const validation = passwordSchema.safeParse(password)
    if (!validation.success || password !== confirmation) {
      setError(!validation.success ? validation.error.issues[0].message : 'As senhas não conferem.')
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
        <p className="rounded-[var(--r-sm)] bg-warn-soft px-3 py-2 text-sm leading-6 text-warn-ink">
          Sua senha atual é provisória e não pode continuar em uso.
        </p>
        <Field id="password" label="Nova senha">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-rules"
            aria-invalid={error && !passwordSchema.safeParse(password).success ? 'true' : undefined}
            placeholder="Escolha uma senha"
          />
        </Field>

        <ul id="password-rules" aria-live="polite" className="grid gap-2 text-sm">
          {rules.map((rule) => (
            <li key={rule.label} className={rule.complete ? 'flex items-center gap-2 text-accent-ink' : 'flex items-center gap-2 text-muted-foreground'}>
              {rule.complete ? <Check aria-hidden="true" className="size-4 text-accent" /> : <Circle aria-hidden="true" className="size-4" />}
              {rule.label}
            </li>
          ))}
        </ul>

        <Field id="confirm_password" label="Repetir a nova senha">
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={error && password !== confirmation ? 'true' : undefined}
            placeholder="Digite de novo"
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-[var(--r-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting || !allRulesComplete} disabledReason={disabledReason} className="mt-1 w-full">
          <KeyRound aria-hidden="true" />
          {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  )
}
