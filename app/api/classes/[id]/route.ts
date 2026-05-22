import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateClassSchema } from '@/lib/classes/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

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

  const result = updateClassSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { catechist_ids, ...classData } = result.data

  if (Object.keys(classData).length > 0) {
    const { error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  if (catechist_ids !== undefined) {
    const { error: deleteError } = await supabase
      .from('class_catechists')
      .delete()
      .eq('class_id', id)

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 })
    }

    if (catechist_ids.length > 0) {
      const assignments = catechist_ids.map((catechist_id) => ({
        class_id: id,
        catechist_id,
      }))
      const { error: insertError } = await supabase
        .from('class_catechists')
        .insert(assignments)

      if (insertError) {
        return Response.json({ error: insertError.message }, { status: 500 })
      }
    }
  }

  const { data: updatedClass, error: fetchError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  return Response.json(updatedClass)
}
