'use client'

import { useState } from 'react'

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

  const isValid = Boolean(classId && from && to)

  const buildUrl = (format: 'pdf' | 'xlsx') =>
    `/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`

  const handleDownload = (format: 'pdf' | 'xlsx') => {
    if (!isValid) return
    window.location.href = buildUrl(format)
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="classId"
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Turma
          </label>
          <select
            id="classId"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              border: '1.5px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Selecione uma turma</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label
              htmlFor="from"
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              De
            </label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                border: '1.5px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label
              htmlFor="to"
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Até
            </label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                border: '1.5px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleDownload('pdf')}
          disabled={!isValid}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-label="Baixar relatório em PDF"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Baixar PDF
        </button>

        <button
          type="button"
          onClick={() => handleDownload('xlsx')}
          disabled={!isValid}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
          style={{
            border: '1.5px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-primary)',
          }}
          aria-label="Baixar relatório em Excel"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Baixar Excel
        </button>
      </div>
    </div>
  )
}
