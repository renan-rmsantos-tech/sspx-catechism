import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateClassDatesSchema } from '@/lib/class-dates/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const academicYearId = new URL(request.url).searchParams.get('academic_year_id')
  if (!academicYearId) {
    return Response.json({ error: 'academic_year_id is required' }, { status: 400 })
  }

  // Get all classes for this academic year to find dates with attendance
  const { data: yearClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('academic_year_id', academicYearId)

  const classIds = (yearClasses ?? []).map((c) => c.id)

  const [{ data, error }, sessionsResult] = await Promise.all([
    supabase
      .from('class_dates')
      .select('date')
      .eq('academic_year_id', academicYearId)
      .order('date', { ascending: true }),
    classIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('date')
          .in('class_id', classIds)
      : Promise.resolve({ data: [] as { date: string }[] }),
  ])

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const lockedDates = [...new Set((sessionsResult.data ?? []).map((s) => s.date))]

  return Response.json({
    dates: (data ?? []).map((r) => r.date),
    lockedDates,
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = updateClassDatesSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { academic_year_id, dates } = result.data

  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('class_days')
    .eq('id', academic_year_id)
    .single()

  const allowedDays: number[] = academicYear?.class_days ?? [6]

  const invalidDates = dates.filter((d) => {
    const day = new Date(`${d}T12:00:00`).getDay()
    return !allowedDays.includes(day)
  })
  if (invalidDates.length > 0) {
    return Response.json(
      { error: `Datas não correspondem aos dias de aula configurados: ${invalidDates.join(', ')}` },
      { status: 400 }
    )
  }

  // Check for dates with existing attendance that would be removed
  const { data: yearClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('academic_year_id', academic_year_id)

  const classIds = (yearClasses ?? []).map((c) => c.id)
  if (classIds.length > 0) {
    const { data: existingSessions } = await supabase
      .from('attendance_sessions')
      .select('date')
      .in('class_id', classIds)

    const datesWithAttendance = new Set((existingSessions ?? []).map((s) => s.date))
    const newDatesSet = new Set(dates)
    const removedLocked = [...datesWithAttendance].filter((d) => !newDatesSet.has(d))

    if (removedLocked.length > 0) {
      return Response.json(
        { error: `Não é possível remover datas com chamada registrada: ${removedLocked.join(', ')}` },
        { status: 400 }
      )
    }
  }

  const { error: deleteError } = await supabase
    .from('class_dates')
    .delete()
    .eq('academic_year_id', academic_year_id)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  if (dates.length === 0) {
    return Response.json({ count: 0 })
  }

  const rows = dates.map((date) => ({ academic_year_id, date }))
  const { error: insertError } = await supabase.from('class_dates').insert(rows)

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  return Response.json({ count: dates.length })
}
