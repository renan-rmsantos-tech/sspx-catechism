import { createSupabaseServerClient } from '@/lib/supabase/server'
import CalendarEditor from '@/components/admin/calendar-editor'

export default async function CalendarioPage() {
  const supabase = await createSupabaseServerClient()

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id, year')
    .eq('is_active', true)
    .maybeSingle()

  if (!activeYear) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Nenhum ano letivo ativo. Crie um primeiro.
        </p>
      </div>
    )
  }

  // Get all classes for this academic year to find dates with attendance
  const { data: yearClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('academic_year_id', activeYear.id)

  const classIds = (yearClasses ?? []).map((c) => c.id)

  const [{ data: classDates }, sessionsResult] = await Promise.all([
    supabase
      .from('class_dates')
      .select('date')
      .eq('academic_year_id', activeYear.id)
      .order('date', { ascending: true }),
    classIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('date')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] as { date: string }[] }),
  ])

  const initialDates = (classDates ?? []).map((r) => r.date)
  const lockedDates = [...new Set((sessionsResult.data ?? []).map((s) => s.date))]

  return (
    <CalendarEditor
      academicYearId={activeYear.id}
      year={activeYear.year}
      initialDates={initialDates}
      lockedDates={lockedDates}
    />
  )
}
