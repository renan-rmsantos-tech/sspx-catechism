import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClassSchema } from '@/lib/classes/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS enforces per-role visibility: coordinator sees all, catechist sees only assigned
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: NextRequest) {
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

  const result = createClassSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { catechist_ids, ...classData } = result.data

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (catechist_ids.length > 0) {
    const assignments = catechist_ids.map((catechist_id) => ({
      class_id: newClass.id,
      catechist_id,
    }))
    const { error: assignError } = await supabase
      .from('class_catechists')
      .insert(assignments)

    if (assignError) {
      return Response.json({ error: assignError.message }, { status: 500 })
    }
  }

  return Response.json(newClass, { status: 201 })
}
