import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  publicEnrollmentSchema,
  submitPublicEnrollment,
  type PublicEnrollmentPayload,
} from '@/lib/enrollment-api'

const emptyValues: Record<keyof PublicEnrollmentPayload, string | boolean> = {
  fullName: '',
  birthDate: '',
  city: '',
  firstCommunion: false,
  confirmation: false,
  previousCatechism: '',
  religiousBooks: '',
  guardianFatherName: '',
  guardianMotherName: '',
  guardianPhone: '',
  guardianEmail: '',
  isRenewal: false,
  previousName: '',
}

function textValue(form: FormData, key: string) {
  return String(form.get(key) ?? '')
}

function payloadFromForm(form: FormData) {
  return {
    fullName: textValue(form, 'fullName'),
    birthDate: textValue(form, 'birthDate'),
    city: textValue(form, 'city'),
    firstCommunion: form.get('firstCommunion') === 'true',
    confirmation: form.get('confirmation') === 'true',
    previousCatechism: textValue(form, 'previousCatechism'),
    religiousBooks: textValue(form, 'religiousBooks'),
    guardianFatherName: textValue(form, 'guardianFatherName'),
    guardianMotherName: textValue(form, 'guardianMotherName'),
    guardianPhone: textValue(form, 'guardianPhone'),
    guardianEmail: textValue(form, 'guardianEmail'),
    isRenewal: form.get('isRenewal') === 'true',
    previousName: textValue(form, 'previousName'),
  }
}

function Field({
  label,
  name,
  type = 'text',
  required,
}: {
  label: string
  name: keyof PublicEnrollmentPayload
  type?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      <input className="input" name={name} type={type} required={required} />
    </label>
  )
}

function Textarea({ label, name }: { label: string; name: keyof PublicEnrollmentPayload }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      <textarea className="input min-h-24" name={name} />
    </label>
  )
}

function BooleanField({ label, name }: { label: string; name: keyof PublicEnrollmentPayload }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-10 items-center justify-center rounded-md border bg-card text-sm">
          <input className="mr-2" type="radio" name={name} value="true" />
          Sim
        </label>
        <label className="flex min-h-10 items-center justify-center rounded-md border bg-card text-sm">
          <input className="mr-2" type="radio" name={name} value="false" defaultChecked />
          Não
        </label>
      </div>
    </fieldset>
  )
}

export function EnrollmentPage() {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isRenewal, setIsRenewal] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)
    const form = new FormData(event.currentTarget)
    const result = publicEnrollmentSchema.safeParse(payloadFromForm(form))
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos')
      setIsPending(false)
      return
    }

    try {
      await submitPublicEnrollment(result.data)
      setSaved(true)
      event.currentTarget.reset()
      setIsRenewal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar inscrição')
    } finally {
      setIsPending(false)
    }
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-background px-5 py-10">
        <section className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <CheckCircle2 className="text-primary" size={48} aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-foreground">Inscrição enviada com sucesso</h1>
          <p className="text-sm text-muted-foreground">
            A coordenação receberá sua inscrição e entrará em contato pelo telefone ou email informado.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <form onSubmit={onSubmit} className="mx-auto grid max-w-3xl gap-6" noValidate>
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Inscrição para catequese</h1>
          <p className="mt-1 text-sm text-muted-foreground">Preencha os dados do catequizando e do responsável.</p>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Dados do catequizando</h2>
          <Field label="Nome completo" name="fullName" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data de nascimento" name="birthDate" type="date" />
            <Field label="Cidade" name="city" />
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Dados pastorais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <BooleanField label="Já fez a Primeira Comunhão?" name="firstCommunion" />
            <BooleanField label="Já recebeu o Crisma?" name="confirmation" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea label="Já fez catequese anteriormente? Qual?" name="previousCatechism" />
            <Textarea label="Já leu algum livro de religião? Qual?" name="religiousBooks" />
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Dados do responsável</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do pai" name="guardianFatherName" />
            <Field label="Nome da mãe / responsável" name="guardianMotherName" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone de contato" name="guardianPhone" required />
            <Field label="Email de contato" name="guardianEmail" type="email" required />
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Renovação</h2>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-foreground">Já frequentou a catequese aqui?</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-h-10 items-center justify-center rounded-md border bg-card text-sm">
                <input
                  className="mr-2"
                  type="radio"
                  name="isRenewal"
                  value="true"
                  onChange={() => setIsRenewal(true)}
                />
                Sim
              </label>
              <label className="flex min-h-10 items-center justify-center rounded-md border bg-card text-sm">
                <input
                  className="mr-2"
                  type="radio"
                  name="isRenewal"
                  value="false"
                  defaultChecked
                  onChange={() => setIsRenewal(false)}
                />
                Não
              </label>
            </div>
          </fieldset>
          {isRenewal && <Field label="Nome como estava cadastrado anteriormente" name="previousName" />}
        </section>

        <div className="pb-6">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto"
          >
            {isPending ? 'Enviando...' : 'Enviar inscrição'}
          </button>
        </div>
      </form>
    </main>
  )
}

export { emptyValues }
