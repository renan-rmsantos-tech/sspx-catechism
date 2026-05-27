'use client'

import { useActionState, useState } from 'react'
import { approveEnrollment, type ActionState } from '../actions'

interface ApproveFormProps {
  enrollmentId: string
  classes: { id: string; name: string }[]
  isRenewal: boolean
  existingStudents: { id: string; full_name: string }[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1.5px solid var(--border)',
  backgroundColor: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  appearance: 'none' as const,
}

export default function ApproveForm({
  enrollmentId,
  classes,
  isRenewal,
  existingStudents,
}: ApproveFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    approveEnrollment,
    null
  )
  const [linkExisting, setLinkExisting] = useState(false)

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
        style={{ color: 'var(--success)', letterSpacing: '0.08em' }}
      >
        Aprovar Inscrição
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
            htmlFor="class_id"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Turma <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <select id="class_id" name="class_id" required style={inputStyle}>
            <option value="" disabled>
              Selecione a turma...
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isRenewal && existingStudents.length > 0 && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={linkExisting}
                onChange={(e) => setLinkExisting(e.target.checked)}
                className="rounded"
              />
              <span style={{ color: 'var(--text-primary)' }}>
                Vincular a aluno existente (renovação)
              </span>
            </label>
            {linkExisting && (
              <div>
                <label
                  htmlFor="existing_student_id"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Aluno existente
                </label>
                <select
                  id="existing_student_id"
                  name="existing_student_id"
                  style={inputStyle}
                >
                  <option value="">Selecione o aluno...</option>
                  {existingStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--success)' }}
          >
            {isPending ? 'Aprovando...' : 'Aprovar e Atribuir Turma'}
          </button>
        </div>
      </form>
    </div>
  )
}
