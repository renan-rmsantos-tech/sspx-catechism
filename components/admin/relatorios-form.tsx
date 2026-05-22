'use client'

import { useState, useCallback } from 'react'
import { getCellValue, calcStudentStats } from '@/lib/reports/query'
import type { ReportData } from '@/lib/reports/query'

interface ClassOption {
  id: string
  name: string
}

interface RelatoriosFormProps {
  classes: ClassOption[]
}

export default function RelatoriosForm({ classes }: RelatoriosFormProps) {
  const [classId, setClassId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = Boolean(classId && from && to)

  const fetchPreview = useCallback(async () => {
    if (!isValid) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const url = `/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=json`
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Erro ao carregar relatório')
      }
      const data: ReportData = await res.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [classId, from, to, isValid])

  const handleDownload = (format: 'pdf' | 'xlsx') => {
    if (!isValid) return
    window.location.href = `/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`
  }

  function formatDate(dateStr: string) {
    const [, m, d] = dateStr.split('-')
    return `${d}/${m}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters card */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="classId" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Turma
            </label>
            <select
              id="classId"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setReport(null) }}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
            >
              <option value="">Selecione uma turma</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="from" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                De
              </label>
              <input
                id="from"
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setReport(null) }}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="to" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Até
              </label>
              <input
                id="to"
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setReport(null) }}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={fetchPreview}
            disabled={!isValid || loading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? 'Carregando...' : 'Visualizar'}
          </button>
          {report && (
            <>
              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </button>
              <button
                type="button"
                onClick={() => handleDownload('xlsx')}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* Preview table */}
      {report && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {report.className} — {report.students.length} alunos, {report.sessions.length} aulas
            </h2>
          </div>

          {report.sessions.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma chamada registrada neste período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider sticky left-0"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)', letterSpacing: '0.06em', minWidth: 180 }}
                    >
                      Aluno
                    </th>
                    {report.sessions.map((s) => (
                      <th
                        key={s.id}
                        className="px-3 py-3 text-center text-xs font-semibold"
                        style={{ color: 'var(--text-secondary)', minWidth: 50 }}
                      >
                        {formatDate(s.date)}
                      </th>
                    ))}
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em', minWidth: 60 }}
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((student) => {
                    const stats = calcStudentStats(student.id, report.sessions, report.records)
                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td
                          className="px-4 py-3 font-medium sticky left-0"
                          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
                        >
                          {student.full_name}
                        </td>
                        {report.sessions.map((s) => {
                          const val = getCellValue(student.id, s.id, report.records)
                          return (
                            <td
                              key={s.id}
                              className="px-3 py-3 text-center font-medium"
                              style={{
                                color: val === 'P' ? '#16A34A' : val === 'F' ? '#DC2626' : 'var(--text-secondary)',
                              }}
                            >
                              {val}
                            </td>
                          )
                        })}
                        <td
                          className="px-3 py-3 text-center font-semibold"
                          style={{ color: 'var(--accent)' }}
                        >
                          {stats.pct}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
