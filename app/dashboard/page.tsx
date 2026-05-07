import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClassCard from '@/components/dashboard/class-card'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import OfflineBanner from '@/components/offline-banner'
import PendingSyncIndicator from '@/components/pending-sync-indicator'

function formatGreetingDate(date: Date): string {
  return date
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, schedule')
    .eq('is_archived', false)
    .order('name')

  const classIds = (classes ?? []).map((c) => c.id)
  const today = new Date().toISOString().split('T')[0]

  const [studentsResult, todaySessionsResult, allSessionsResult] = await Promise.all([
    classIds.length > 0
      ? supabase.from('students').select('class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] as { class_id: string }[] }),
    classIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('class_id')
          .in('class_id', classIds)
          .eq('date', today)
      : Promise.resolve({ data: [] as { class_id: string }[] }),
    classIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('id, class_id')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] as { id: string; class_id: string }[] }),
  ])

  const students = studentsResult.data ?? []
  const todaySessions = todaySessionsResult.data ?? []
  const allSessions = allSessionsResult.data ?? []

  const sessionIds = allSessions.map((s) => s.id)
  const { data: records } =
    sessionIds.length > 0
      ? await supabase
          .from('attendance_records')
          .select('session_id, present')
          .in('session_id', sessionIds)
      : { data: [] as { session_id: string; present: boolean }[] }

  const todaySessionClassIds = new Set(todaySessions.map((s) => s.class_id))

  const studentCountByClass = students.reduce(
    (acc, s) => {
      acc[s.class_id] = (acc[s.class_id] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const sessionsByClass = allSessions.reduce(
    (acc, s) => {
      if (!acc[s.class_id]) acc[s.class_id] = []
      acc[s.class_id].push(s.id)
      return acc
    },
    {} as Record<string, string[]>
  )

  const presenceByClass = (classes ?? []).reduce(
    (acc, cls) => {
      const classSessionIds = sessionsByClass[cls.id] ?? []
      const classRecords = (records ?? []).filter((r) =>
        classSessionIds.includes(r.session_id)
      )
      const total = classRecords.length
      const present = classRecords.filter((r) => r.present).length
      acc[cls.id] = total > 0 ? Math.round((present / total) * 100) : 0
      return acc
    },
    {} as Record<string, number>
  )

  const pendingClasses = (classes ?? []).filter((c) => !todaySessionClassIds.has(c.id))
  const doneClasses = (classes ?? []).filter((c) => todaySessionClassIds.has(c.id))
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Catequista'
  const nextPending = pendingClasses[0]

  return (
    <>
      <OfflineBanner />
      <PendingSyncIndicator />
      <DashboardHeader />

      {/* Page content */}
      <div className="px-5 pt-4 pb-36">
        <p
          className="text-xs font-semibold tracking-widest mb-1"
          style={{ color: 'var(--text-secondary)' }}
          data-testid="greeting-date"
        >
          {formatGreetingDate(new Date())}
        </p>
        <h2
          className="text-3xl font-extrabold mb-6"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          data-testid="greeting-name"
        >
          Olá, {firstName}
        </h2>

        <p
          className="text-xs font-bold tracking-widest mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          SUAS TURMAS
        </p>

        <div className="flex flex-col gap-4" data-testid="class-list">
          {(classes ?? []).length === 0 && (
            <p
              className="text-center py-8 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nenhuma turma atribuída.
            </p>
          )}
          {(classes ?? []).map((cls) => (
            <ClassCard
              key={cls.id}
              id={cls.id}
              name={cls.name}
              schedule={cls.schedule}
              studentCount={studentCountByClass[cls.id] ?? 0}
              attendanceDone={todaySessionClassIds.has(cls.id)}
              presencePercent={presenceByClass[cls.id] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA — fixed */}
      {nextPending && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 py-4"
          style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}
        >
          <Link
            href={`/dashboard/turmas/${nextPending.id}/chamada`}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold text-white"
            style={{ backgroundColor: '#78350F', minHeight: '56px' }}
            data-testid="btn-iniciar-chamada"
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
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Iniciar Chamada — {nextPending.name}
          </Link>
          {doneClasses.length > 0 && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: 'var(--text-secondary)' }}
              data-testid="done-classes-note"
            >
              {doneClasses.map((c) => c.name).join(', ')}{' '}
              {doneClasses.length === 1 ? 'já teve chamada hoje' : 'já tiveram chamada hoje'}
            </p>
          )}
        </div>
      )}
    </>
  )
}
