'use client'

import { useState, useRef } from 'react'
import {
  createCatechistAction,
  promoteToCoordinatorAction,
  deactivateCatechistAction,
  activateCatechistAction,
  deleteCatechistAction,
} from '@/app/admin/catequistas/actions'
import type { ActionState, CreateCatechistResult } from '@/app/admin/catequistas/actions'

export interface CatechistRow {
  id: string
  full_name: string
  role: 'coordinator' | 'catechist' | 'admin'
  is_active: boolean
  classes: string[]
  created_at: string
}

export interface CatechistsViewProps {
  catechists: CatechistRow[]
  currentUserId: string
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === 'admin'
      ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
      : role === 'coordinator'
        ? { backgroundColor: '#EDE9FE', color: '#7C3AED' }
        : { backgroundColor: '#FEF9C3', color: '#B45309' }

  const label =
    role === 'admin' ? 'Admin' : role === 'coordinator' ? 'Coordenador(a)' : 'Catequista'

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={styles}
    >
      {label}
    </span>
  )
}

function CreatedPasswordCard({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
    >
      <h2 className="text-sm font-semibold mb-1" style={{ color: '#166534' }}>
        Catequista cadastrado com sucesso!
      </h2>
      <p className="text-xs mb-4" style={{ color: '#15803D' }}>
        Salve a senha abaixo e repasse para o catequista. Ele deverá trocar a senha no primeiro login.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#166534' }}>E-mail:</span>
          <span className="text-sm font-mono" style={{ color: '#166534' }}>{email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#166534' }}>Senha:</span>
          <code
            className="rounded px-2 py-1 text-sm font-mono font-bold select-all"
            style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
          >
            {password}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded px-2 py-1 text-xs font-medium"
            style={{ backgroundColor: '#166534', color: 'white' }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 text-xs font-medium hover:underline"
        style={{ color: '#166534' }}
      >
        Fechar
      </button>
    </div>
  )
}

export default function CatechistsView({ catechists, currentUserId }: CatechistsViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdResult, setCreatedResult] = useState<{ email: string; password: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const active = catechists.filter((c) => c.is_active)
  const inactive = catechists.filter((c) => !c.is_active)

  async function handleCreateSubmit(formData: FormData) {
    setIsSubmitting(true)
    setFormError(null)
    const result = await createCatechistAction(null, formData)
    setIsSubmitting(false)

    if (result && 'error' in result) {
      setFormError(result.error)
    } else if (result && 'password' in result) {
      setCreatedResult({ email: result.email, password: result.password })
      setShowForm(false)
      formRef.current?.reset()
    }
  }

  async function handlePromote(userId: string, name: string) {
    if (!confirm(`Promover ${name} a Coordenador(a)?`)) return
    setActionError(null)
    const result = await promoteToCoordinatorAction(userId)
    if (result?.error) setActionError(result.error)
  }

  async function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Desativar ${name}?`)) return
    setActionError(null)
    const result = await deactivateCatechistAction(userId)
    if (result?.error) setActionError(result.error)
  }

  async function handleActivate(userId: string) {
    setActionError(null)
    const result = await activateCatechistAction(userId)
    if (result?.error) setActionError(result.error)
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Excluir ${name} permanentemente? Esta ação não pode ser desfeita.`)) return
    setActionError(null)
    const result = await deleteCatechistAction(userId)
    if (result?.error) setActionError(result.error)
  }

  const isSelf = (id: string) => id === currentUserId
  const canAct = (cat: CatechistRow) => cat.role !== 'admin' && !isSelf(cat.id)

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
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
          Cadastrar Catequista
        </button>
      </div>

      {createdResult && (
        <CreatedPasswordCard
          email={createdResult.email}
          password={createdResult.password}
          onClose={() => setCreatedResult(null)}
        />
      )}

      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Novo catequista
          </h2>
          <form ref={formRef} action={handleCreateSubmit} className="flex items-end gap-4">
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
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          {formError && (
            <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>{formError}</p>
          )}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: 'var(--error)' }}>
          {actionError}
        </div>
      )}

      {/* Active catechists */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ativos ({active.length})
          </h2>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum catequista ativo.
          </div>
        ) : (
          <ul>
            {active.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {cat.full_name}
                  </span>
                  <RoleBadge role={cat.role} />
                  <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {cat.classes.length > 0 ? cat.classes.join(', ') : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {isSelf(cat.id) && (
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Você</span>
                  )}
                  {canAct(cat) && cat.role === 'catechist' && (
                    <button
                      type="button"
                      onClick={() => handlePromote(cat.id, cat.full_name)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      Promover
                    </button>
                  )}
                  {canAct(cat) && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(cat.id, cat.full_name)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Desativar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Inactive catechists */}
      {inactive.length > 0 && (
        <div
          className="rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Inativos ({inactive.length})
            </h2>
          </div>
          <ul>
            {inactive.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {cat.full_name}
                  </span>
                  <RoleBadge role={cat.role} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleActivate(cat.id)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Reativar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.full_name)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#DC2626' }}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
