import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AttendanceSheet from '@/components/dashboard/attendance-sheet'
import AttendanceBlocked from '@/components/dashboard/attendance-blocked'

export default async function ChamadaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // RLS enforces catechist can only see their assigned classes
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name, schedule, academic_year_id')
    .eq('id', id)
    .single()

  if (!classData) notFound()

  const today = new Date().toISOString().split('T')[0]

  // Format date for display, using noon to avoid TZ issues
  const formattedDate = new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Check if today is a scheduled class date
  const { data: scheduledDate } = await supabase
    .from('class_dates')
    .select('id')
    .eq('academic_year_id', classData.academic_year_id)
    .eq('date', today)
    .maybeSingle()

  if (!scheduledDate) {
    return (
      <AttendanceBlocked
        className={classData.name}
        formattedDate={formattedDate}
      />
    )
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', id)
    .order('full_name')

  return (
    <AttendanceSheet
      classId={id}
      className={classData.name}
      date={today}
      catechistId={user.id}
      students={students ?? []}
      formattedDate={formattedDate}
    />
  )
}
