import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-[var(--r-lg)] border border-border bg-surface p-[var(--sp-5)]', { variants: { variant: { default: '', tight: 'p-[var(--sp-4)]', flush: 'overflow-hidden p-0', accent: 'border-accent-line bg-accent-soft', link: 'transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-2' } }, defaultVariants: { variant: 'default' } })
function Card({ className, variant, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) { return <div data-slot="card" className={cn(cardVariants({ variant, className }))} {...props} /> }
export { Card, cardVariants }
