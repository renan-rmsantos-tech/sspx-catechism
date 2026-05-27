'use client'

import { useActionState } from 'react'
import { rejectEnrollment, type ActionState } from '../actions'

interface RejectFormProps {
  enrollmentId: string
}

export default function RejectForm({ enrollmentId }: RejectFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    rejectEnrollment,
    null
  )

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--error)', letterSpacing: '0.08em' }}
      >
        Rejeitar Inscrição
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="enrollment_id" value={enrollmentId} />

        {state?.error && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: 'var(--error)' }}
            role="alert"
          >
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="rejection_reason"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Motivo da rejeição (opcional)
          </label>
          <textarea
            id="rejection_reason"
            name="rejection_reason"
            rows={3}
            placeholder="Informe o motivo, se desejar..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical' as const,
            }}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--error)' }}
          >
            {isPending ? 'Rejeitando...' : 'Rejeitar Inscrição'}
          </button>
        </div>
      </form>
    </div>
  )
}
