import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const segVariants = cva('inline-flex overflow-hidden rounded-[var(--r-sm)] border border-border bg-surface', { variants: { size: { md: '', sm: 'text-xs' } }, defaultVariants: { size: 'md' } })
type SegOption<T extends string> = { value: T; label: string; disabled?: boolean }
function Seg<T extends string>({ value, onValueChange, options, size, className, ariaLabel }: { value: T | null; onValueChange: (value: T) => void; options: SegOption<T>[]; ariaLabel: string; className?: string } & VariantProps<typeof segVariants>) { return <div className={cn(segVariants({ size, className }))} role="group" aria-label={ariaLabel}>{options.map((option) => <button key={option.value} type="button" disabled={option.disabled} aria-pressed={value === option.value} onClick={() => onValueChange(option.value)} className={cn('min-h-touch min-w-11 border-r border-border px-3 font-semibold last:border-r-0 disabled:opacity-50', value === option.value && 'bg-accent text-primary-foreground')}>{option.label}</button>)}</div> }
export { Seg, segVariants, type SegOption }
