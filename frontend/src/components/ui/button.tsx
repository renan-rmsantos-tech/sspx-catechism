import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('inline-flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-[var(--r)] border px-4 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-[var(--dur)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4', {
  variants: {
    variant: {
      primary: 'border-transparent bg-accent text-primary-foreground shadow-2 hover:bg-[var(--accent-press)]',
      secondary: 'border-border bg-surface text-fg shadow-1 hover:bg-surface-2',
      ghost: 'border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-fg',
      danger: 'border-danger bg-surface text-danger-ink hover:bg-danger-soft',
      default: 'border-transparent bg-accent text-primary-foreground shadow-2 hover:bg-[var(--accent-press)]',
      outline: 'border-border bg-surface text-fg shadow-1 hover:bg-surface-2',
      destructive: 'border-danger bg-surface text-danger-ink hover:bg-danger-soft',
    },
    size: { sm: 'min-h-[34px] px-3 text-xs', md: 'min-h-touch', lg: 'min-h-[52px] px-5 text-base', block: 'w-full', icon: 'size-touch min-h-0 px-0' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { disabledReason?: string }

function Button({ className, variant, size, disabledReason, disabled, children, ...props }: ButtonProps) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} disabled={disabled} {...props}>{disabled && disabledReason ? disabledReason : children}</ButtonPrimitive>
}

export { Button, buttonVariants }
