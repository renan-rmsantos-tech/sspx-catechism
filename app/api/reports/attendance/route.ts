import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { reportParamsSchema } from '@/lib/reports/query'
import { generatePdf } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const parseResult = reportParamsSchema.safeParse({
    classId: searchParams.get('classId') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
    format: searchParams.get('format') ?? '',
  })

  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues }, { status: 400 })
  }

  const { classId, from, to, format } = parseResult.data

  const [{ data: cls }, { data: students }, { data: sessions }] = await Promise.all([
    supabase.from('classes').select('name').eq('id', classId).single(),
    supabase.from('students').select('id, full_name').eq('class_id', classId).order('full_name'),
    supabase
      .from('attendance_sessions')
      .select('id, date')
      .eq('class_id', classId)
      .gte('date', from)
      .lte('date', to)
      .order('date'),
  ])

  const sessionIds = (sessions ?? []).map((s) => s.id)
  let records: { session_id: string; student_id: string; present: boolean }[] = []
  if (sessionIds.length > 0) {
    const { data: fetchedRecords } = await supabase
      .from('attendance_records')
      .select('session_id, student_id, present')
      .in('session_id', sessionIds)
    records = fetchedRecords ?? []
  }

  const reportData = {
    className: cls?.name ?? classId,
    from,
    to,
    students: students ?? [],
    sessions: sessions ?? [],
    records,
  }

  if (format === 'pdf') {
    const buffer = generatePdf(reportData)
    const filename = `relatorio-${from}-${to}.pdf`
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const buffer = generateExcel(reportData)
  const filename = `relatorio-${from}-${to}.xlsx`
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
