import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AttendanceSheet from '@/components/dashboard/attendance-sheet'

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
  if (!user) redirect('/login')

  // RLS enforces catechist can only see their assigned classes
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name, schedule')
    .eq('id', id)
    .single()

  if (!classData) notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', id)
    .order('full_name')

  const today = new Date().toISOString().split('T')[0]

  // Format date for display, using noon to avoid TZ issues
  const formattedDate = new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
