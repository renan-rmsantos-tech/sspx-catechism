'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { inviteCatechistSchema } from '@/lib/classes/schemas'

export type ActionState = { error: string } | null

async function getCoordinatorClient() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coordinator') return null
  return supabase
}

export async function inviteCatechistAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const body = {
    email: (formData.get('email') as string)?.trim(),
    full_name: (formData.get('full_name') as string)?.trim(),
  }

  const result = inviteCatechistSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Dados inválidos' }
  }

  const admin = createSupabaseAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(result.data.email, {
    data: { full_name: result.data.full_name, role: 'catechist' },
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/catequistas')
  return null
}

export async function promoteToCoordinatorAction(userId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role: 'coordinator' })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/catequistas')
  return null
}
