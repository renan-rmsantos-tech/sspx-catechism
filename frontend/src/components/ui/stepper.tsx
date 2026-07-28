import { cn } from '@/lib/utils'
type Step = { label: string; description?: string }
function Stepper({ steps, current, className }: { steps: Step[]; current: number; className?: string }) {
  return <ol className={cn('flex gap-2', className)}>{steps.map((step, index) => {
    const state = index < current ? 'done' : index === current ? 'current' : 'upcoming'
    return <li key={step.label} aria-current={index === current ? 'step' : undefined} data-state={state} className="flex min-w-0 flex-1 flex-col gap-2">
      <i aria-hidden="true" data-testid={`stepper-rail-${index}`} className={cn('h-1 rounded-full bg-surface-3', state === 'done' && 'bg-accent', state === 'current' && 'bg-[linear-gradient(90deg,var(--accent)_50%,var(--surface-3)_50%)]')} />
      <span className={cn('hidden min-w-0 truncate font-mono text-[11.5px] tracking-[0.05em] text-muted uppercase min-[720px]:block', state === 'current' && 'text-accent-ink')}>
        {step.label}{step.description ? ` · ${step.description}` : ''}
      </span>
    </li>
  })}</ol>
}
export { Stepper, type Step }
