'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'

interface CalendarEditorProps {
  academicYearId: string
  year: number
  initialDates: string[]
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface DayCell {
  date: string
  day: number
  isSaturday: boolean
}

function getMonthCells(year: number, month: number): (DayCell | null)[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (DayCell | null)[] = []

  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d)
    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    cells.push({
      date: `${yyyy}-${mm}-${dd}`,
      day: d,
      isSaturday: dateObj.getDay() === 6,
    })
  }

  while (cells.length < 42) cells.push(null)
  return cells
}

function getAllSaturdays(year: number): string[] {
  const saturdays: string[] = []
  const date = new Date(year, 0, 1)
  while (date.getDay() !== 6) date.setDate(date.getDate() + 1)
  while (date.getFullYear() === year) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    saturdays.push(`${yyyy}-${mm}-${dd}`)
    date.setDate(date.getDate() + 7)
  }
  return saturdays
}

export default function CalendarEditor({ academicYearId, year, initialDates }: CalendarEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialDates))
  const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set(initialDates))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isDirty = useMemo(() => {
    if (selected.size !== savedSet.size) return true
    for (const d of selected) {
      if (!savedSet.has(d)) return true
    }
    return false
  }, [selected, savedSet])

  const toggle = useCallback((date: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
    setMessage(null)
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(getAllSaturdays(year)))
    setMessage(null)
  }, [year])

  const clearAll = useCallback(() => {
    setSelected(new Set())
    setMessage(null)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setMessage(null)
    try {
      const dates = Array.from(selected).sort()
      const res = await fetch('/api/class-dates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year_id: academicYearId, dates }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error ?? 'Erro ao salvar' })
        return
      }
      const data = await res.json()
      setSavedSet(new Set(dates))
      setMessage({ type: 'success', text: `${data.count} sábado${data.count !== 1 ? 's' : ''} salvo${data.count !== 1 ? 's' : ''}` })
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão' })
    } finally {
      setSaving(false)
    }
  }, [selected, academicYearId])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Calendário Letivo {year}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Selecione os sábados com aula. {selected.size} sábado{selected.size !== 1 ? 's' : ''} selecionado{selected.size !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Selecionar todos
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Limpar
          </button>
          <Button
            disabled={!isDirty || saving}
            onClick={save}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className="mb-6 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: message.type === 'success' ? 'var(--accent-light, #FEF3C7)' : '#FEE2E2',
            color: message.type === 'success' ? 'var(--accent, #B45309)' : 'var(--error, #DC2626)',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Dirty indicator */}
      {isDirty && !message && (
        <div
          className="mb-6 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        >
          Alterações não salvas
        </div>
      )}

      {/* Month grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 12 }, (_, month) => (
          <MonthCard
            key={month}
            year={year}
            month={month}
            selected={selected}
            today={today}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  )
}

function MonthCard({
  year,
  month,
  selected,
  today,
  onToggle,
}: {
  year: number
  month: number
  selected: Set<string>
  today: string
  onToggle: (date: string) => void
}) {
  const cells = useMemo(() => getMonthCells(year, month), [year, month])

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
      }}
    >
      <h3
        className="text-sm font-bold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {MONTH_NAMES[month]}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-semibold py-1"
            style={{ color: i === 6 ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />

          const isSelected = selected.has(cell.date)
          const isToday = cell.date === today

          if (!cell.isSaturday) {
            return (
              <div
                key={i}
                className="flex items-center justify-center w-full aspect-square rounded-lg text-xs"
                style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
              >
                {cell.day}
              </div>
            )
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(cell.date)}
              className="flex items-center justify-center w-full aspect-square rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                border: isSelected ? 'none' : '1.5px solid var(--border)',
                boxShadow: isToday ? '0 0 0 2px var(--accent)' : 'none',
              }}
              title={cell.date}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
