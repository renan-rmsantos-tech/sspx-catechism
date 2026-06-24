import { CalendarCheck, LogOut, RefreshCw, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { cacheClassDates } from '@/lib/class-dates-cache'
import { loadDashboardData, type DashboardData } from '@/lib/dashboard-api'
import {
  getPendingSessionCount,
  registerAttendanceSyncHandlers,
  syncPendingSessions,
} from '@/lib/attendance-sync'

const today = () => new Date().toISOString().slice(0, 10)

function formatGreetingDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  async function refreshPendingCount() {
    setPendingCount(await getPendingSessionCount())
  }

  async function refreshData() {
    setIsLoading(true)
    setError(null)
    try {
      const next = await loadDashboardData()
      setData(next)
      if (next.activeYear) {
        await cacheClassDates(next.activeYear.id, next.classDates)
      }
      await refreshPendingCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    registerAttendanceSyncHandlers()
    void refreshData()
  }, [])

  useEffect(() => {
    const onOnline = async () => {
      setSyncing(true)
      try {
        await syncPendingSessions()
        await refreshData()
      } catch {
        await refreshPendingCount()
      } finally {
        setSyncing(false)
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  const view = useMemo(() => {
    if (!data) return null
    const currentDate = today()
    const isScheduledDay = data.classDates.includes(currentDate)
    const todayClassIds = new Set(
      data.attendance
        .filter((session) => session.date === currentDate)
        .map((session) => session.classId),
    )

    const statsByClass = Object.fromEntries(
      data.classes.map((item) => {
        const sessions = data.attendance.filter((session) => session.classId === item.id)
        const records = sessions.flatMap((session) => session.records)
        const present = records.filter((record) => record.present).length
        const percent = records.length ? Math.round((present / records.length) * 100) : 0
        return [item.id, { percent, doneToday: todayClassIds.has(item.id) }]
      }),
    )

    const pendingClass = data.classes.find((item) => !todayClassIds.has(item.id)) ?? null
    return { currentDate, isScheduledDay, statsByClass, pendingClass }
  }, [data])

  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-10 border-b bg-card px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-primary">Catequese</h1>
            <p className="text-sm text-muted-foreground">{user?.fullName ?? 'Catequista'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <UserRound aria-hidden="true" size={18} />
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {formatGreetingDate(new Date())}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">
          Olá, {user?.fullName.split(' ')[0] ?? 'Catequista'}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md border bg-card px-3 py-2 text-muted-foreground">
            {navigator.onLine ? 'Online' : 'Offline'}
          </span>
          <span className="rounded-md border bg-card px-3 py-2 text-muted-foreground">
            {pendingCount} chamada{pendingCount === 1 ? '' : 's'} pendente
          </span>
          {syncing && (
            <span className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-muted-foreground">
              <RefreshCw aria-hidden="true" size={14} className="animate-spin" />
              Sincronizando
            </span>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5">
        {isLoading && <p className="py-8 text-sm text-muted-foreground">Carregando turmas...</p>}
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {data && view && (
          <div className="space-y-3" data-testid="class-list">
            {data.classes.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma turma atribuída.</p>
            )}
            {data.classes.map((item) => {
              const students = data.studentsByClass[item.id] ?? []
              const stat = view.statsByClass[item.id]
              return (
                <article key={item.id} className="rounded-lg border bg-card p-4" data-testid="class-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.schedule ? `${item.schedule} · ` : ''}
                        {students.length} aluno{students.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {view.isScheduledDay && (
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        {stat.doneToday ? 'Feita' : 'Pendente'}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-sm bg-muted" aria-label={`${stat.percent}% de presença`}>
                    <div className="h-full bg-primary" style={{ width: `${stat.percent}%` }} />
                  </div>
                  <p className="mt-1 text-right text-sm text-muted-foreground">{stat.percent}% presença</p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {data && view && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background px-5 py-4">
          <div className="mx-auto max-w-3xl">
            {!view.isScheduledDay && (
              <div className="flex min-h-14 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
                Não há aula programada para hoje
              </div>
            )}
            {view.isScheduledDay && view.pendingClass && (
              <Link
                to={`/dashboard/turmas/${view.pendingClass.id}/chamada`}
                className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground"
                data-testid="btn-iniciar-chamada"
              >
                <CalendarCheck aria-hidden="true" size={20} />
                Iniciar chamada - {view.pendingClass.name}
              </Link>
            )}
            {view.isScheduledDay && !view.pendingClass && (
              <div className="flex min-h-14 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
                Todas as chamadas de hoje foram registradas
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
