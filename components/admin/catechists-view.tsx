'use client'

import { useActionState, useState } from 'react'
import { inviteCatechistAction, promoteToCoordinatorAction } from '@/app/admin/catequistas/actions'
import type { ActionState } from '@/app/admin/catequistas/actions'

export interface CatechistRow {
  id: string
  full_name: string
  role: 'coordinator' | 'catechist'
  classes: string[]
  created_at: string
}

export interface CatechistsViewProps {
  catechists: CatechistRow[]
  currentUserId: string
}

export default function CatechistsView({ catechists, currentUserId }: CatechistsViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(inviteCatechistAction, null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handlePromote(userId: string, name: string) {
    if (!confirm(`Tem certeza que deseja promover ${name} a Coordenador(a)?`)) return
    setActionError(null)
    const result = await promoteToCoordinatorAction(userId)
    if (result?.error) setActionError(result.error)
  }

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Catequistas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Gerencie catequistas e coordenadores
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
          Convidar Catequista
        </button>
      </div>

      {/* Invite form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Convidar por e-mail
          </h2>
          <form action={formAction} className="flex items-end gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="full_name" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Maria da Silva"
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="email" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@exemplo.com"
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isPending ? 'Enviando...' : 'Enviar Convite'}
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

      {/* Catechists list */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Equipe ({catechists.length})
          </h2>
        </div>
        {catechists.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum catequista cadastrado.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Nome
                </th>
                <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Papel
                </th>
                <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Turmas
                </th>
                <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {catechists.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {cat.full_name}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                      style={
                        cat.role === 'coordinator'
                          ? { backgroundColor: '#EDE9FE', color: '#7C3AED' }
                          : { backgroundColor: '#FEF9C3', color: '#B45309' }
                      }
                    >
                      {cat.role === 'coordinator' ? 'Coordenador(a)' : 'Catequista'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {cat.classes.length > 0 ? cat.classes.join(', ') : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {cat.role === 'catechist' && cat.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => handlePromote(cat.id, cat.full_name)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Promover a Coordenador
                      </button>
                    )}
                    {cat.id === currentUserId && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Você
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
