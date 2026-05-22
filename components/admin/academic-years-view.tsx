'use client'

import { useActionState, useState } from 'react'
import { createAcademicYearAction, toggleAcademicYearAction, deleteAcademicYearAction } from '@/app/admin/anos-letivos/actions'
import type { ActionState } from '@/app/admin/anos-letivos/actions'

export interface AcademicYearRow {
  id: string
  year: number
  is_active: boolean
  classCount: number
}

export interface AcademicYearsViewProps {
  years: AcademicYearRow[]
}

export default function AcademicYearsView({ years }: AcademicYearsViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createAcademicYearAction, null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleToggle(yearId: string, isActive: boolean) {
    setActionError(null)
    const result = await toggleAcademicYearAction(yearId, isActive)
    if (result?.error) setActionError(result.error)
  }

  async function handleDelete(yearId: string) {
    if (!confirm('Tem certeza que deseja excluir este ano letivo?')) return
    setActionError(null)
    const result = await deleteAcademicYearAction(yearId)
    if (result?.error) setActionError(result.error)
  }

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Anos Letivos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Gerencie os anos letivos da catequese
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Ano Letivo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Criar Ano Letivo
          </h2>
          <form action={formAction} className="flex items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="year" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ano
              </label>
              <input
                id="year"
                name="year"
                type="number"
                required
                min={2000}
                max={2100}
                defaultValue={new Date().getFullYear()}
                className="rounded-lg px-3 py-2 text-sm w-32"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                value="true"
                defaultChecked
                className="rounded"
                style={{ accentColor: 'var(--accent)' }}
              />
              <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Ativo
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isPending ? 'Criando...' : 'Criar'}
            </button>
          </form>
          {state?.error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>
              {state.error}
            </p>
          )}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: 'var(--error)' }}>
          {actionError}
        </div>
      )}

      {/* Years list */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Todos os anos ({years.length})
          </h2>
        </div>
        {years.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum ano letivo cadastrado.
          </div>
        ) : (
          <ul>
            {years.map((year) => (
              <li
                key={year.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {year.year}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                    style={
                      year.is_active
                        ? { backgroundColor: '#DCFCE7', color: '#16A34A' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {year.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {year.classCount} {year.classCount === 1 ? 'turma' : 'turmas'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(year.id, !year.is_active)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    {year.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(year.id)}
                    disabled={year.classCount > 0}
                    className="text-xs font-medium hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'var(--text-secondary)' }}
                    title={year.classCount > 0 ? 'Remova as turmas vinculadas primeiro' : 'Excluir ano letivo'}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
