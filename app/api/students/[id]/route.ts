import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateStudentSchema } from '@/lib/students/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const { data, error } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', id)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }

  return Response.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = updateStudentSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { data: updatedStudent, error } = await supabase
    .from('students')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(updatedStudent)
}
