import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
type ChoiceOption = { value: string; label: string; description?: string; disabled?: boolean }
function Choice({ name, value, onChange, options, legend, className }: { name: string; value?: string; onChange: (value: string) => void; options: ChoiceOption[]; legend: string; className?: string }) { return <fieldset className={cn('grid gap-2 border-0 p-0', className)}><legend className="mb-1 text-sm font-semibold">{legend}</legend><div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option.value} className={cn('flex min-h-touch cursor-pointer items-center gap-3 rounded-[var(--r-sm)] border border-border bg-surface px-3 py-2 text-sm font-semibold transition-colors has-checked:border-accent-line has-checked:bg-accent-soft has-checked:text-accent-ink', option.disabled && 'cursor-not-allowed opacity-50')}><input className="sr-only" type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onChange(option.value)} /><span><span className="block">{option.label}</span>{option.description ? <span className="block text-xs font-normal text-muted">{option.description}</span> : null}</span></label>)}</div></fieldset> }
const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string }>(({ className, id, label, ...props }, ref) => {
  const controlId = id ?? props.name
  return <label htmlFor={controlId} className="flex min-h-touch items-center gap-3 text-sm font-medium"><input ref={ref} id={controlId} type="checkbox" className={cn('size-4 rounded border-border text-accent accent-accent', className)} {...props} /><span>{label}</span></label>
})
Checkbox.displayName = 'Checkbox'
export { Checkbox, Choice, type ChoiceOption }
