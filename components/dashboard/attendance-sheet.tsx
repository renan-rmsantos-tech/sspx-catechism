'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { registerBackgroundSync } from '@/lib/attendance-sync'

interface Student {
  id: string
  full_name: string
}

interface AttendanceSheetProps {
  classId: string
  className: string
  date: string
  catechistId: string
  students: Student[]
  formattedDate: string
}

type Mark = boolean | null

function formatAttendanceSaveError(status: number, body: unknown): string {
  const fallback = `Erro ao salvar chamada (${status})`
  if (!body || typeof body !== 'object' || !('error' in body)) return fallback
  const raw = (body as { error: unknown }).error
  if (typeof raw === 'string') {
    if (raw === 'Unauthorized') return 'Sessão expirada. Faça login novamente.'
    return raw
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const o = item as { path?: unknown; message?: unknown }
        const path = Array.isArray(o.path)
          ? o.path
              .filter((p): p is string | number => typeof p === 'string' || typeof p === 'number')
              .join('.')
          : ''
        const msg = typeof o.message === 'string' ? o.message : null
        if (!msg) return null
        return path ? `${path}: ${msg}` : msg
      })
      .filter((s): s is string => Boolean(s))
    if (parts.length) return parts.join(' · ')
  }
  return fallback
}

export default function AttendanceSheet({
  classId,
  className,
  date,
  catechistId,
  students,
  formattedDate,
}: AttendanceSheetProps) {
  const router = useRouter()
  const [marks, setMarks] = useState<Record<string, Mark>>(
    () => Object.fromEntries(students.map((s) => [s.id, null]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offlineSaved, setOfflineSaved] = useState(false)

  useEffect(() => {
    registerBackgroundSync()
  }, [])

  const toggle = useCallback((studentId: string, value: boolean) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === value ? null : value,
    }))
  }, [])

  const markedValues = students.map((s) => marks[s.id])
  const presentCount = markedValues.filter((v) => v === true).length
  const absentCount = markedValues.filter((v) => v === false).length
  const pendingCount = markedValues.filter((v) => v === null).length
  const markedCount = presentCount + absentCount
  const allMarked = pendingCount === 0 && students.length > 0

  const handleConfirm = async () => {
    if (!allMarked || submitting) return
    setSubmitting(true)
    setError(null)

    const session = {
      id: crypto.randomUUID(),
      classId,
      date,
      catechistId,
      records: students.map((s) => ({
        studentId: s.id,
        present: marks[s.id] as boolean,
      })),
      createdAt: Date.now(),
    }

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: [session] }),
        })
        if (!res.ok) {
          let body: unknown
          try {
            body = await res.json()
          } catch {
            body = undefined
          }
          setError(formatAttendanceSaveError(res.status, body))
          setSubmitting(false)
          return
        }
        router.push('/dashboard')
        router.refresh()
      } else {
        await db.pending_sessions.add(session)
        setOfflineSaved(true)
        setSubmitting(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      data-testid="attendance-sheet"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Amber header */}
      <header
        className="px-5 pt-12 pb-5"
        style={{ backgroundColor: '#78350F' }}
        data-testid="chamada-header"
      >
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-12 h-12 rounded-full"
            aria-label="Voltar para Minhas Turmas"
            style={{ color: 'white' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="currentColor"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {className}
            </p>
            <h1 className="text-xl font-bold text-white">Chamada de hoje</h1>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: '44px' }}>
          {formattedDate} &bull;{' '}
          <span className="font-semibold text-white" data-testid="marked-counter">
            {markedCount} de {students.length} marcados
          </span>
        </p>
      </header>

      {/* Student list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: '120px' }}
        data-testid="student-list"
      >
        {students.length === 0 && (
          <p
            className="text-center py-10 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Nenhum aluno encontrado nesta turma.
          </p>
        )}
        {students.map((student, idx) => {
          const mark = marks[student.id]
          const initial = student.full_name.charAt(0).toUpperCase()

          let avatarBg = '#E5E7EB'
          let avatarColor = '#6B7280'
          if (mark === true) {
            avatarBg = '#FEF3C7'
            avatarColor = '#B45309'
          } else if (mark === false) {
            avatarBg = '#FEE2E2'
            avatarColor = '#DC2626'
          }

          return (
            <div
              key={student.id}
              className="flex items-center gap-3 px-5"
              style={{
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom:
                  idx < students.length - 1
                    ? '1px solid var(--border)'
                    : undefined,
              }}
              data-testid="student-row"
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: avatarBg, color: avatarColor }}
                aria-hidden="true"
              >
                {initial}
              </div>
              <span
                className="flex-1 text-base font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {student.full_name}
              </span>
              <div className="flex gap-2">
                {/* Present button — min 48px height/width */}
                <button
                  type="button"
                  aria-label={`Marcar ${student.full_name} como presente`}
                  data-testid={`btn-present-${student.id}`}
                  onClick={() => toggle(student.id, true)}
                  className="w-12 h-12 rounded-xl border-2 flex items-center justify-center"
                  style={{
                    borderColor: mark === true ? '#16A34A' : '#D1D5DB',
                    backgroundColor: mark === true ? '#DCFCE7' : '#F9FAFB',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ stroke: mark === true ? '#16A34A' : '#9CA3AF' }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                {/* Absent button — min 48px height/width */}
                <button
                  type="button"
                  aria-label={`Marcar ${student.full_name} como ausente`}
                  data-testid={`btn-absent-${student.id}`}
                  onClick={() => toggle(student.id, false)}
                  className="w-12 h-12 rounded-xl border-2 flex items-center justify-center"
                  style={{
                    borderColor: mark === false ? '#DC2626' : '#D1D5DB',
                    backgroundColor: mark === false ? '#FEE2E2' : '#F9FAFB',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ stroke: mark === false ? '#DC2626' : '#9CA3AF' }}
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar — fixed */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4"
        style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        data-testid="bottom-bar"
      >
        <div
          className="flex justify-between text-sm mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span data-testid="pending-count">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </span>
          <span>
            <span data-testid="present-count">
              {presentCount} presente{presentCount !== 1 ? 's' : ''}
            </span>
            {' · '}
            <span data-testid="absent-count">
              {absentCount} ausente{absentCount !== 1 ? 's' : ''}
            </span>
          </span>
        </div>
        {error && (
          <p className="text-sm text-center mb-2" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}
        {offlineSaved && (
          <p
            className="text-sm text-center mb-2"
            style={{ color: '#B45309' }}
            data-testid="offline-saved-message"
          >
            Chamada salva. Será sincronizada quando a conexão retornar.
          </p>
        )}
        <button
          type="button"
          disabled={!allMarked || submitting}
          onClick={handleConfirm}
          data-testid="btn-confirm"
          className="w-full py-4 rounded-2xl text-base font-bold text-white"
          style={{
            backgroundColor: '#78350F',
            opacity: allMarked && !submitting ? 1 : 0.4,
            cursor: allMarked && !submitting ? 'pointer' : 'not-allowed',
            minHeight: '56px',
          }}
        >
          {submitting ? 'Salvando...' : 'Confirmar Chamada'}
        </button>
      </div>
    </div>
  )
}
