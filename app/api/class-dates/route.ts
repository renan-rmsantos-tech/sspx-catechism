import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateClassDatesSchema } from '@/lib/class-dates/schemas'

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

  const { data, error } = await supabase
    .from('class_dates')
    .select('date')
    .eq('academic_year_id', academicYearId)
    .order('date', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ dates: (data ?? []).map((r) => r.date) })
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

  if (profile?.role !== 'coordinator') {
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

  const invalidDates = dates.filter((d) => {
    const day = new Date(`${d}T12:00:00`).getDay()
    return day !== 6
  })
  if (invalidDates.length > 0) {
    return Response.json(
      { error: `Datas não são sábados: ${invalidDates.join(', ')}` },
      { status: 400 }
    )
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
