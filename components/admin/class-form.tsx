'use client'

import { useActionState } from 'react'
import type { AcademicYear, Profile } from '@/lib/supabase/types'

export interface ClassFormProps {
  academicYears: AcademicYear[]
  catechists: Profile[]
  defaultValues?: {
    name?: string
    academic_year_id?: string
    level?: string
    schedule?: string
    catechist_ids?: string[]
  }
  action: (prev: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
  submitLabel?: string
}

export default function ClassForm({
  academicYears,
  catechists,
  defaultValues,
  action,
  submitLabel = 'Salvar',
}: ClassFormProps) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Nome da turma <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder="Ex: Turma A — 1º Ano"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="academic_year_id" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Ano letivo <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <select
          id="academic_year_id"
          name="academic_year_id"
          required
          defaultValue={defaultValues?.academic_year_id}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Selecione o ano letivo</option>
          {academicYears.map((ay) => (
            <option key={ay.id} value={ay.id}>
              {ay.year}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="level" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Nível
        </label>
        <input
          id="level"
          name="level"
          type="text"
          defaultValue={defaultValues?.level}
          placeholder="Ex: 1º Ano"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="schedule" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Horário
        </label>
        <input
          id="schedule"
          name="schedule"
          type="text"
          defaultValue={defaultValues?.schedule}
          placeholder="Ex: Sábados às 9h"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Catequistas
        </span>
        <div className="flex flex-col gap-2">
          {catechists.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum catequista cadastrado.
            </p>
          ) : (
            catechists.map((catechist) => (
              <label key={catechist.id} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  name="catechist_ids"
                  value={catechist.id}
                  defaultChecked={defaultValues?.catechist_ids?.includes(catechist.id)}
                  className="rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                {catechist.full_name}
              </label>
            ))
          )}
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#FEF2F2', color: 'var(--error)' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {submitLabel}
      </button>
    </form>
  )
}
