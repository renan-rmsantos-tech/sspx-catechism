import { CheckCircle2, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Brand } from '@/components/ui/brand'
import { Button } from '@/components/ui/button'
import { Choice } from '@/components/ui/choice'
import { Field, Input, Textarea } from '@/components/ui/field'
import { NetworkChip } from '@/components/ui/chip'
import { Stepper } from '@/components/ui/stepper'
import {
  publicEnrollmentSchema,
  submitPublicEnrollment,
  type PublicEnrollmentPayload,
} from '@/lib/enrollment-api'

const steps = [
  { label: 'Catequizando' },
  { label: 'Vida pastoral' },
  { label: 'Responsável' },
  { label: 'Revisão' },
]

const stepSchemas = [
  publicEnrollmentSchema.pick({ fullName: true, birthDate: true, city: true }),
  publicEnrollmentSchema.pick({
    firstCommunion: true,
    confirmation: true,
    previousCatechism: true,
    religiousBooks: true,
  }),
  publicEnrollmentSchema.pick({
    guardianFatherName: true,
    guardianMotherName: true,
    guardianPhone: true,
    guardianEmail: true,
    isRenewal: true,
    previousName: true,
  }),
]

type EnrollmentValues = {
  fullName: string
  birthDate: string
  city: string
  firstCommunion: boolean
  confirmation: boolean
  previousCatechism: string
  religiousBooks: string
  guardianFatherName: string
  guardianMotherName: string
  guardianPhone: string
  guardianEmail: string
  isRenewal: boolean
  previousName: string
}

const emptyValues: EnrollmentValues = {
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

function ErrorBanner({ children }: { children: string }) {
  return (
    <div role="alert" className="rounded-[var(--r)] border border-danger bg-danger-soft p-4 text-sm text-danger-ink">
      {children}
    </div>
  )
}

const DRAFT_KEY = 'inscricao-rascunho'

export function EnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const stepRef = useRef(0)
  const form = useForm<EnrollmentValues, unknown, PublicEnrollmentPayload>({
    defaultValues: emptyValues,
    resolver: zodResolver(publicEnrollmentSchema),
  })
  const { formState: { errors, isSubmitting }, getValues, handleSubmit, register, setError, setValue, watch } = form
  const isRenewal = watch('isRenewal')

  // O voltar do celular precisa voltar UM PASSO (não sair do site) e o que já
  // foi digitado precisa sobreviver a saídas e retornos
  // (BUG-20260725-voltar-do-navegador-perde-inscricao).
  useEffect(() => {
    let restoredStep = 0
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw) as { values?: EnrollmentValues; step?: number }
        if (draft.values) {
          form.reset({ ...emptyValues, ...draft.values })
          restoredStep = Math.min(Math.max(draft.step ?? 0, 0), steps.length - 1)
          setDraftRestored(true)
        }
      }
    } catch {
      sessionStorage.removeItem(DRAFT_KEY)
    }
    stepRef.current = restoredStep
    setCurrentStep(restoredStep)
    window.history.replaceState({ enrollmentStep: restoredStep }, '')
    const onPop = (event: PopStateEvent) => {
      const step = (event.state as { enrollmentStep?: number } | null)?.enrollmentStep
      if (typeof step === 'number') {
        stepRef.current = step
        setCurrentStep(step)
        window.scrollTo({ top: 0 })
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const subscription = watch((values) => {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step: stepRef.current }))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  function goToStep(step: number, push: boolean) {
    stepRef.current = step
    setCurrentStep(step)
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), step }))
    if (push) window.history.pushState({ enrollmentStep: step }, '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function advance() {
    const result = stepSchemas[currentStep]?.safeParse(getValues())
    if (!result?.success) {
      for (const issue of result.error.issues) {
        const name = issue.path[0] as FieldPath<EnrollmentValues>
        if (name) setError(name, { message: issue.message })
      }
      return
    }
    goToStep(Math.min(currentStep + 1, steps.length - 1), true)
  }

  async function submit(values: PublicEnrollmentPayload) {
    setSubmissionError(null)
    try {
      await submitPublicEnrollment(values)
      sessionStorage.removeItem(DRAFT_KEY)
      setSaved(true)
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Não foi possível enviar a inscrição. Tente de novo.')
    }
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[var(--r-lg)] border border-accent-line bg-accent-soft p-6 text-center" data-od-id="enrollment-success">
          <CheckCircle2 className="text-accent" size={48} aria-hidden="true" />
          <div className="space-y-2">
            <p className="eyebrow text-accent-ink">Inscrição recebida</p>
            <h1>Inscrição enviada com sucesso</h1>
            <p className="text-sm text-muted-foreground">A coordenação vai analisar os dados e entrará em contato pelo telefone ou e-mail informado.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur" data-od-id="appbar">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Brand />
          <span className="flex-1" />
          <NetworkChip />
        </div>
      </header>

      <form onSubmit={handleSubmit(submit)} className="mx-auto grid max-w-3xl gap-6 px-4 py-8" noValidate>
        <header className="space-y-2" data-od-id="enrollment-heading">
          <p className="eyebrow">Inscrição pública</p>
          <h1>Inscrição para catequese</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Você preenche em quatro passos curtos. Os dados ficam guardados enquanto avança ou volta.</p>
        </header>

        <Stepper steps={steps} current={currentStep} data-od-id="enrollment-stepper" />
        {draftRestored && (
          <div role="status" className="rounded-[var(--r)] border border-info bg-info-soft p-4 text-sm text-info-ink" data-testid="draft-restored">
            Recuperamos o que você já tinha preenchido. Continue de onde parou.
          </div>
        )}
        {submissionError && <ErrorBanner>{submissionError}</ErrorBanner>}

        {currentStep === 0 && (
          <section className="grid gap-4 rounded-[var(--r-lg)] border border-border bg-surface p-5" data-od-id="enrollment-student-step">
            <div><p className="eyebrow">Passo 1 de 4</p><h2>Dados do catequizando</h2></div>
            <Field id="fullName" label="Nome completo — como consta na certidão de batismo" error={errors.fullName?.message}>
              <Input id="fullName" placeholder="Como consta na certidão de batismo" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="birthDate" label="Data de nascimento" error={errors.birthDate?.message}>
                <Input id="birthDate" type="date" aria-invalid={Boolean(errors.birthDate)} {...register('birthDate')} />
              </Field>
              <Field id="city" label="Cidade" error={errors.city?.message}>
                <Input id="city" placeholder="Cidade onde mora" aria-invalid={Boolean(errors.city)} {...register('city')} />
              </Field>
            </div>
          </section>
        )}

        {currentStep === 1 && (
          <section className="grid gap-5 rounded-[var(--r-lg)] border border-border bg-surface p-5" data-od-id="enrollment-history-step">
            <div><p className="eyebrow">Passo 2 de 4</p><h2>Histórico religioso</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Choice name="firstCommunion" legend="Já fez a Primeira Comunhão?" value={String(watch('firstCommunion'))} onChange={(value) => setValue('firstCommunion', value === 'true', { shouldValidate: true })} options={[{ value: 'true', label: 'Sim, já fez' }, { value: 'false', label: 'Ainda não' }]} />
              <Choice name="confirmation" legend="Já recebeu o Crisma?" value={String(watch('confirmation'))} onChange={(value) => setValue('confirmation', value === 'true', { shouldValidate: true })} options={[{ value: 'true', label: 'Sim, já recebeu' }, { value: 'false', label: 'Ainda não' }]} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="previousCatechism" label="Já fez catequese anteriormente?" error={errors.previousCatechism?.message}>
                <Textarea id="previousCatechism" placeholder="Paróquia, capela ou colégio — e por quanto tempo" aria-invalid={Boolean(errors.previousCatechism)} {...register('previousCatechism')} />
              </Field>
              <Field id="religiousBooks" label="Já leu algum livro de religião?" error={errors.religiousBooks?.message}>
                <Textarea id="religiousBooks" placeholder="Conte quais livros ajudaram na caminhada de fé" aria-invalid={Boolean(errors.religiousBooks)} {...register('religiousBooks')} />
              </Field>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="grid gap-5 rounded-[var(--r-lg)] border border-border bg-surface p-5" data-od-id="enrollment-guardians-step">
            <div><p className="eyebrow">Passo 3 de 4</p><h2>Dados dos responsáveis</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="guardianFatherName" label="Nome do pai" error={errors.guardianFatherName?.message}><Input id="guardianFatherName" placeholder="Nome completo, se informado" aria-invalid={Boolean(errors.guardianFatherName)} {...register('guardianFatherName')} /></Field>
              <Field id="guardianMotherName" label="Nome da mãe ou responsável" error={errors.guardianMotherName?.message}><Input id="guardianMotherName" placeholder="Nome completo" aria-invalid={Boolean(errors.guardianMotherName)} {...register('guardianMotherName')} /></Field>
              <Field id="guardianPhone" label="Telefone de contato" error={errors.guardianPhone?.message}><Input id="guardianPhone" type="tel" placeholder="(11) 99999-9999" aria-invalid={Boolean(errors.guardianPhone)} {...register('guardianPhone')} /></Field>
              <Field id="guardianEmail" label="E-mail de contato" error={errors.guardianEmail?.message}><Input id="guardianEmail" type="email" placeholder="familia@exemplo.com" aria-invalid={Boolean(errors.guardianEmail)} {...register('guardianEmail')} /></Field>
            </div>
            <Choice name="isRenewal" legend="Já frequentou a catequese aqui?" value={String(isRenewal)} onChange={(value) => setValue('isRenewal', value === 'true', { shouldValidate: true })} options={[{ value: 'true', label: 'Sim, é renovação' }, { value: 'false', label: 'Não, é a primeira vez' }]} />
            {isRenewal && <Field id="previousName" label="Nome como estava cadastrado anteriormente" error={errors.previousName?.message}><Input id="previousName" placeholder="Nome usado na inscrição anterior" aria-invalid={Boolean(errors.previousName)} {...register('previousName')} /></Field>}
          </section>
        )}

        {currentStep === 3 && (
          <section className="grid gap-5 rounded-[var(--r-lg)] border border-border bg-surface p-5" data-od-id="enrollment-review-step">
            <div><p className="eyebrow">Passo 4 de 4</p><h2>Revise antes de enviar</h2><p className="mt-1 text-sm text-muted-foreground">Confira os dados. Você pode voltar para corrigir qualquer informação.</p></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Catequizando</dt><dd className="font-semibold text-fg">{watch('fullName')}</dd></div>
              <div><dt className="text-muted">Nascimento</dt><dd className="font-semibold text-fg">{watch('birthDate') || 'Não informado'}</dd></div>
              <div><dt className="text-muted">Telefone</dt><dd className="font-semibold text-fg">{watch('guardianPhone')}</dd></div>
              <div><dt className="text-muted">E-mail</dt><dd className="font-semibold text-fg">{watch('guardianEmail')}</dd></div>
            </dl>
          </section>
        )}

        <footer className="flex flex-wrap gap-3" data-od-id="enrollment-actions">
          {currentStep > 0 && <Button type="button" variant="secondary" onClick={() => window.history.back()}>Voltar</Button>}
          {currentStep < steps.length - 1 ? <Button type="button" onClick={advance}>Continuar</Button> : <Button type="submit" disabled={isSubmitting} disabledReason="Enviando…"><Send aria-hidden="true" size={18} />{isSubmitting ? 'Enviando…' : 'Enviar inscrição'}</Button>}
        </footer>
      </form>
    </main>
  )
}

export { emptyValues }
