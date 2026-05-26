import { createSupabaseServerClient } from '@/lib/supabase/server'
import CalendarPageView, { type AcademicYearRow } from '@/components/admin/calendar-page-view'

export default async function CalendarioPage() {
  const supabase = await createSupabaseServerClient()

  const { data: years, error } = await supabase
    .from('academic_years')
    .select('id, year, is_active, class_days')
    .order('year', { ascending: false })

  if (error) {
    return (
      <CalendarPageView
        years={[]}
        activeYear={null}
        activeClassDays={[6]}
        initialDates={[]}
        lockedDates={[]}
      />
    )
  }

  const yearIds = (years ?? []).map((y) => y.id)
  const { data: allClasses } = yearIds.length > 0
    ? await supabase
        .from('classes')
        .select('id, academic_year_id')
        .in('academic_year_id', yearIds)
    : { data: [] }

  const classCountMap: Record<string, number> = {}
  for (const cls of allClasses ?? []) {
    classCountMap[cls.academic_year_id] = (classCountMap[cls.academic_year_id] ?? 0) + 1
  }

  const rows: AcademicYearRow[] = (years ?? []).map((y) => ({
    id: y.id,
    year: y.year,
    is_active: y.is_active,
    class_days: (y.class_days as number[]) ?? [6],
    classCount: classCountMap[y.id] ?? 0,
  }))

  const activeYear = (years ?? []).find((y) => y.is_active) ?? null
  const activeClassDays: number[] = activeYear ? ((activeYear.class_days as number[]) ?? [6]) : [6]

  let initialDates: string[] = []
  let lockedDates: string[] = []

  if (activeYear) {
    const activeClassIds = (allClasses ?? [])
      .filter((c) => c.academic_year_id === activeYear.id)
      .map((c) => c.id)

    const [{ data: classDates }, sessionsResult] = await Promise.all([
      supabase
        .from('class_dates')
        .select('date')
        .eq('academic_year_id', activeYear.id)
        .order('date', { ascending: true }),
      activeClassIds.length > 0
        ? supabase
            .from('attendance_sessions')
            .select('date')
            .in('class_id', activeClassIds)
        : Promise.resolve({ data: [] as { date: string }[] }),
    ])

    initialDates = (classDates ?? []).map((r) => r.date)
    lockedDates = [...new Set((sessionsResult.data ?? []).map((s) => s.date))]
  }

  return (
    <CalendarPageView
      years={rows}
      activeYear={activeYear ? { id: activeYear.id, year: activeYear.year } : null}
      activeClassDays={activeClassDays}
      initialDates={initialDates}
      lockedDates={lockedDates}
    />
  )
}
