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

  const { data: classDates } = await supabase
    .from('class_dates')
    .select('date')
    .eq('academic_year_id', activeYear.id)
    .order('date', { ascending: true })

  const initialDates = (classDates ?? []).map((r) => r.date)

  return (
    <CalendarEditor
      academicYearId={activeYear.id}
      year={activeYear.year}
      initialDates={initialDates}
    />
  )
}
