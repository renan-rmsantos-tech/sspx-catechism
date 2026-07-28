import { Dialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// Ações destrutivas pedem confirmação explícita
// (BUG-20260724-remover-ano-sem-confirmacao, decisão de 2026-07-27).
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Remover',
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-fg-line" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-sm rounded-[var(--r-lg)] border border-border bg-surface p-5 shadow-3">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-2 text-sm text-muted">{description}</Dialog.Description>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={onConfirm} data-testid="confirm-destructive">
                {confirmLabel}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { ConfirmDialog }
