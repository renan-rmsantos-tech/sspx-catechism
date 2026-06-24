import { ArrowLeft, Check, LogOut, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import type { PendingSession } from '@/lib/attendance-types'
import { submitAttendanceSession } from '@/lib/attendance-sync'
import { isDateScheduledOffline } from '@/lib/class-dates-cache'
import { loadAttendanceSheetData, type DashboardStudent } from '@/lib/dashboard-api'

type Mark = boolean | null

const today = () => new Date().toISOString().slice(0, 10)

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function makeSession(
  classId: string,
  catechistId: string,
  students: DashboardStudent[],
  marks: Record<string, Mark>,
): PendingSession {
  return {
    id: crypto.randomUUID(),
    classId,
    date: today(),
    catechistId,
    records: students.map((student) => ({
      studentId: student.id,
      present: marks[student.id] === true,
    })),
    createdAt: Date.now(),
  }
}

export function AttendancePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState<DashboardStudent[]>([])
  const [isScheduled, setIsScheduled] = useState(true)
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [error, setError] = useState<string | null>(null)
  const [offlineSaved, setOfflineSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const classId = id
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await loadAttendanceSheetData(classId)
        if (!data.classItem) throw new Error('Turma não encontrada')
        let scheduled = data.classDates.includes(today())
        if (!scheduled && data.activeYear) {
          scheduled = await isDateScheduledOffline(data.activeYear.id, today())
        }
        if (cancelled) return
        setClassName(data.classItem.name)
        setStudents(data.students)
        setIsScheduled(scheduled)
        setMarks(Object.fromEntries(data.students.map((student) => [student.id, null])))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar chamada')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const counts = useMemo(() => {
    const values = students.map((student) => marks[student.id])
    return {
      present: values.filter((value) => value === true).length,
      absent: values.filter((value) => value === false).length,
      pending: values.filter((value) => value === null).length,
    }
  }, [marks, students])
  const allMarked = students.length > 0 && counts.pending === 0

  function toggle(studentId: string, value: boolean) {
    setMarks((current) => ({
      ...current,
      [studentId]: current[studentId] === value ? null : value,
    }))
  }

  async function confirmAttendance() {
    if (!id || !user || !allMarked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitAttendanceSession(makeSession(id, user.id, students, marks))
      if (result === 'queued') {
        setOfflineSaved(true)
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar chamada')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="border-b bg-primary px-5 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
              aria-label="Voltar para o dashboard"
            >
              <ArrowLeft aria-hidden="true" size={20} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm opacity-80">{className || 'Turma'}</p>
              <h1 className="text-xl font-semibold">Chamada de hoje</h1>
              <p className="mt-1 text-sm opacity-80">
                {formatDisplayDate(today())} · {counts.present + counts.absent} de {students.length} marcados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut aria-hidden="true" size={19} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-4">
        {loading && <p className="py-8 text-sm text-muted-foreground">Carregando alunos...</p>}
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loading && !isScheduled && (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Hoje não está cadastrado como dia de aula para o ano ativo.
          </div>
        )}
        {!loading && isScheduled && (
          <div className="divide-y rounded-lg border bg-card" data-testid="student-list">
            {students.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhum aluno encontrado nesta turma.</p>
            )}
            {students.map((student) => {
              const mark = marks[student.id]
              return (
                <div key={student.id} className="flex items-center gap-3 p-4" data-testid="student-row">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary font-semibold text-secondary-foreground">
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-card-foreground">{student.fullName}</span>
                  <button
                    type="button"
                    onClick={() => toggle(student.id, true)}
                    className="flex h-11 w-11 items-center justify-center rounded-md border"
                    style={{
                      backgroundColor: mark === true ? '#dcfce7' : 'transparent',
                      borderColor: mark === true ? '#16a34a' : undefined,
                      color: mark === true ? '#15803d' : undefined,
                    }}
                    aria-label={`Marcar ${student.fullName} como presente`}
                  >
                    <Check aria-hidden="true" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(student.id, false)}
                    className="flex h-11 w-11 items-center justify-center rounded-md border"
                    style={{
                      backgroundColor: mark === false ? '#fee2e2' : 'transparent',
                      borderColor: mark === false ? '#dc2626' : undefined,
                      color: mark === false ? '#b91c1c' : undefined,
                    }}
                    aria-label={`Marcar ${student.fullName} como ausente`}
                  >
                    <X aria-hidden="true" size={20} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {isScheduled && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-card px-5 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex justify-between text-sm text-muted-foreground">
              <span>{counts.pending} pendente{counts.pending === 1 ? '' : 's'}</span>
              <span>{counts.present} presente{counts.present === 1 ? '' : 's'} · {counts.absent} ausente{counts.absent === 1 ? '' : 's'}</span>
            </div>
            {offlineSaved && (
              <p className="mb-2 text-center text-sm text-primary" data-testid="offline-saved-message">
                Chamada salva. Será sincronizada quando a conexão retornar.
              </p>
            )}
            <button
              type="button"
              onClick={() => void confirmAttendance()}
              disabled={!allMarked || submitting}
              className="min-h-14 w-full rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="btn-confirm"
            >
              {submitting ? 'Salvando...' : 'Confirmar chamada'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
