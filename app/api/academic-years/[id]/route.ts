import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateAcademicYearSchema } from '@/lib/classes/schemas'

async function getCoordinator() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coordinator') return null
  return supabase
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getCoordinator()
  if (!supabase) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = updateAcademicYearSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('academic_years')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getCoordinator()
  if (!supabase) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return Response.json(
        { error: 'Ano letivo possui turmas vinculadas e não pode ser excluído' },
        { status: 409 }
      )
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
