import type { ReactNode } from 'react'
import { Brand } from '@/components/ui/brand'

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="flex min-h-[18rem] flex-col justify-between gap-[var(--sp-7)] bg-fg px-[var(--sp-5)] py-[var(--sp-6)] text-surface sm:px-[var(--sp-7)] lg:min-h-screen lg:py-[var(--sp-7)]">
        <div className="grid gap-7">
          <Brand className="text-surface [&_img]:brightness-0 [&_img]:invert" />
          <div className="grid gap-4">
            <p className="display max-w-[15ch]">A catequese, presente em cada encontro.</p>
            <p className="max-w-[40ch] text-base leading-relaxed text-surface/75">
              Registre a presença e acompanhe as turmas pelo celular, mesmo quando o sinal não ajuda.
            </p>
          </div>
        </div>
        <p className="eyebrow text-surface/60">Paróquia · presença</p>
      </aside>
      <section className="grid place-items-center px-4 py-[var(--sp-6)] sm:px-[var(--sp-6)]">
        <div className="w-full max-w-[24.5rem]">
          <header className="grid gap-2">
            <p className="eyebrow text-accent-ink">Acesso restrito</p>
            <h1>{title}</h1>
            {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </header>
          <div className="mt-[var(--sp-6)]">{children}</div>
        </div>
      </section>
    </main>
  )
}
