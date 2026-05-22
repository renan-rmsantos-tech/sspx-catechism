import { createSupabaseServerClient } from '@/lib/supabase/server'
import AcademicYearsView, { type AcademicYearRow } from '@/components/admin/academic-years-view'

export default async function AnosLetivosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: years, error } = await supabase
    .from('academic_years')
    .select('id, year, is_active')
    .order('year', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar anos letivos.
      </div>
    )
  }

  const yearIds = (years ?? []).map((y) => y.id)

  const { data: classes } = yearIds.length > 0
    ? await supabase
        .from('classes')
        .select('id, academic_year_id')
        .in('academic_year_id', yearIds)
    : { data: [] }

  const classCountMap: Record<string, number> = {}
  for (const cls of classes ?? []) {
    classCountMap[cls.academic_year_id] = (classCountMap[cls.academic_year_id] ?? 0) + 1
  }

  const rows: AcademicYearRow[] = (years ?? []).map((y) => ({
    id: y.id,
    year: y.year,
    is_active: y.is_active,
    classCount: classCountMap[y.id] ?? 0,
  }))

  return <AcademicYearsView years={rows} />
}
