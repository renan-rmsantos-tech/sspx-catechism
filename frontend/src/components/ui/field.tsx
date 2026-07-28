import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

function Field({ id, label, hint, error, children, className }: { id?: string; label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) { return <div className={cn('grid gap-1.5', className)}><label htmlFor={id} className="text-sm font-semibold text-fg">{label}</label>{children}{error ? <span role="alert" className="text-xs text-danger-ink">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}</div> }
const control = 'min-h-touch w-full rounded-[var(--r-sm)] border border-border bg-surface px-3 text-sm text-fg shadow-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent focus:shadow-[var(--focus-field-ring)] aria-invalid:border-danger aria-invalid:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50'
const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn(control, className)} {...props} />)
Input.displayName = 'Input'
const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => <select ref={ref} className={cn(control, className)} {...props} />)
Select.displayName = 'Select'
const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn(control, 'min-h-28 py-3', className)} {...props} />)
Textarea.displayName = 'Textarea'
const SearchField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(({ className, label, ...props }, ref) => <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" /><input ref={ref} type="search" aria-label={label} className={cn(control, 'pl-10', className)} {...props} /></div>)
SearchField.displayName = 'SearchField'
export { Field, Input, SearchField, Select, Textarea }
