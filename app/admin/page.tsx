import { createSupabaseServerClient } from '@/lib/supabase/server'
import DashboardView, { type ClassRow, type DashboardStats } from '@/components/admin/dashboard-view'

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: activeClasses, error: classesError },
    { count: totalStudents },
    { count: catechistCount },
    { count: sessionsTodayCount },
    { data: activeYear },
  ] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, schedule')
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'catechist'),
    supabase
      .from('attendance_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('date', today),
    supabase
      .from('academic_years')
      .select('year')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (classesError) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar dados. Tente novamente.
      </div>
    )
  }

  const classIds = (activeClasses ?? []).map((c) => c.id)

  const [
    { data: students },
    { data: assignments },
    { data: sessions },
  ] = await Promise.all([
    classIds.length > 0
      ? supabase.from('students').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase
          .from('class_catechists')
          .select('class_id, catechist_id')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('id, class_id, date')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  const catechistIds = [...new Set((assignments ?? []).map((a) => a.catechist_id))]
  const { data: catechistProfiles } = catechistIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', catechistIds)
    : { data: [] }

  const sessionIds = (sessions ?? []).map((s) => s.id)
  const { data: records } = sessionIds.length > 0
    ? await supabase
        .from('attendance_records')
        .select('session_id, present')
        .in('session_id', sessionIds)
    : { data: [] }

  // Build per-class maps
  const studentCountMap: Record<string, number> = {}
  for (const s of students ?? []) {
    studentCountMap[s.class_id] = (studentCountMap[s.class_id] ?? 0) + 1
  }

  const classAssignmentMap: Record<string, string[]> = {}
  for (const a of assignments ?? []) {
    const profile = (catechistProfiles ?? []).find((p) => p.id === a.catechist_id)
    if (profile) {
      classAssignmentMap[a.class_id] = [...(classAssignmentMap[a.class_id] ?? []), profile.full_name]
    }
  }

  function getAttendancePercent(classId: string): number {
    const classSessions = (sessions ?? []).filter((s) => s.class_id === classId)
    const classSessionIds = classSessions.map((s) => s.id)
    const classRecords = (records ?? []).filter((r) => classSessionIds.includes(r.session_id))
    if (!classRecords.length) return 0
    const presentCount = classRecords.filter((r) => r.present).length
    return Math.round((presentCount / classRecords.length) * 100)
  }

  const classes: ClassRow[] = (activeClasses ?? []).map((cls) => ({
    id: cls.id,
    name: cls.name,
    schedule: cls.schedule,
    catechists: classAssignmentMap[cls.id] ?? [],
    studentCount: studentCountMap[cls.id] ?? 0,
    attendancePercent: getAttendancePercent(cls.id),
    hasSessionToday: (sessions ?? []).some((s) => s.class_id === cls.id && s.date === today),
  }))

  const allPercents = classes.map((c) => c.attendancePercent)
  const avgAttendance =
    allPercents.length > 0
      ? Math.round(allPercents.reduce((a, b) => a + b, 0) / allPercents.length)
      : 0

  const stats: DashboardStats = {
    activeClasses: activeClasses?.length ?? 0,
    totalStudents: totalStudents ?? 0,
    avgAttendance,
    sessionsToday: sessionsTodayCount ?? 0,
    totalClasses: activeClasses?.length ?? 0,
  }

  const yearLabel = activeYear?.year
    ? `Ano letivo ${activeYear.year}`
    : 'Ano letivo'
  const dateLabel = capitalize(formatDateLabel(new Date()))

  return (
    <DashboardView
      stats={stats}
      classes={classes}
      academicYearLabel={yearLabel}
      dateLabel={dateLabel}
    />
  )
}
