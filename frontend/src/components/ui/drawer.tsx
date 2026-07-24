import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

function Drawer({ open, onOpenChange, title, description, children, footer, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-fg-line" /><Dialog.Viewport className="fixed inset-0 z-50 flex justify-end"><Dialog.Popup className={cn('flex h-full w-full max-w-[460px] flex-col bg-surface shadow-3', className)}><header className="flex items-start justify-between gap-4 border-b border-border p-5"><div className="min-w-0"><Dialog.Title className="text-xl">{title}</Dialog.Title>{description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : null}</div><Dialog.Close aria-label="Fechar" className="flex size-touch shrink-0 items-center justify-center rounded-[var(--r-sm)] text-muted hover:bg-surface-2"><X /></Dialog.Close></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>{footer ? <footer className="border-t border-border p-5">{footer}</footer> : null}</Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
}
export { Drawer }
