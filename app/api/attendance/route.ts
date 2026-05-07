import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { submitAttendanceSchema } from '@/lib/attendance/schemas'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = submitAttendanceSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  let synced = 0
  let skipped = 0

  for (const session of result.data.sessions) {
    // Validate that the date is a scheduled class date
    const { data: classRow } = await supabase
      .from('classes')
      .select('academic_year_id')
      .eq('id', session.classId)
      .single()

    if (classRow) {
      const { data: scheduledDate } = await supabase
        .from('class_dates')
        .select('id')
        .eq('academic_year_id', classRow.academic_year_id)
        .eq('date', session.date)
        .maybeSingle()

      if (!scheduledDate) {
        skipped++
        continue
      }
    }

    // Idempotency check: if a session for this class+date already exists, skip it
    const { data: existing } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', session.classId)
      .eq('date', session.date)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert({
        class_id: session.classId,
        date: session.date,
        catechist_id: user.id,
        synced_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sessionError || !newSession) {
      skipped++
      continue
    }

    if (session.records.length > 0) {
      const records = session.records.map((r) => ({
        session_id: newSession.id,
        student_id: r.studentId,
        present: r.present,
      }))
      await supabase.from('attendance_records').insert(records)
    }

    synced++
  }

  return Response.json({ synced, skipped })
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('attendance_sessions')
    .select('id, class_id, date, catechist_id, synced_at, attendance_records(id, student_id, present)')
    .order('date', { ascending: false })

  if (classId) query = query.eq('class_id', classId)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
