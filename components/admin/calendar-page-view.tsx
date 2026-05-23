'use client'

import { useActionState, useState } from 'react'
import {
  createAcademicYearAction,
  toggleAcademicYearAction,
  deleteAcademicYearAction,
  updateClassDaysAction,
} from '@/app/admin/calendario/actions'
import type { ActionState } from '@/app/admin/calendario/actions'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
import CalendarEditor from '@/components/admin/calendar-editor'

export interface AcademicYearRow {
  id: string
  year: number
  is_active: boolean
  class_days: number[]
  classCount: number
}

export interface CalendarPageViewProps {
  years: AcademicYearRow[]
  activeYear: { id: string; year: number } | null
  activeClassDays: number[]
  initialDates: string[]
  lockedDates: string[]
}

function formatClassDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  return sorted.map((d) => WEEKDAY_LABELS[d]).join(', ')
}

export default function CalendarPageView({
  years,
  activeYear,
  activeClassDays,
  initialDates,
  lockedDates,
}: CalendarPageViewProps) {
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
            Calendário
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Anos letivos e datas de aula
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

      {/* Create year form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Criar Ano Letivo
          </h2>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex items-end gap-4">
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
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Dias de aula
              </span>
              <div className="flex gap-2">
                {WEEKDAY_SHORT.map((label, i) => (
                  <label
                    key={i}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-xs font-semibold cursor-pointer transition-colors has-[:checked]:text-white"
                    style={{
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="class_days"
                      value={i}
                      defaultChecked={i === 6}
                      className="sr-only peer"
                    />
                    <span className="flex items-center justify-center w-full h-full rounded-lg peer-checked:bg-[var(--accent)] peer-checked:text-white">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
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

      {/* Academic years list */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Anos Letivos ({years.length})
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
                    {formatClassDays(year.class_days)}
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

      {/* Calendar editor for active year */}
      {activeYear ? (
        <CalendarEditor
          academicYearId={activeYear.id}
          year={activeYear.year}
          classDays={activeClassDays}
          initialDates={initialDates}
          lockedDates={lockedDates}
          onClassDaysChange={async (days) => {
            setActionError(null)
            const result = await updateClassDaysAction(activeYear.id, days)
            if (result?.error) setActionError(result.error)
          }}
        />
      ) : (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ative um ano letivo para gerenciar o calendário de aulas.
          </p>
        </div>
      )}
    </div>
  )
}
