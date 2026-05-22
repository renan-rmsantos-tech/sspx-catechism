'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { inviteCatechistSchema } from '@/lib/classes/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

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

  if (!isCoordinatorOrAdmin(profile?.role)) return null
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

export async function deactivateCatechistAction(userId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const admin = createSupabaseAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (target?.role === 'admin') return { error: 'O administrador não pode ser desativado' }

  const { error } = await admin
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/catequistas')
  return null
}

export async function activateCatechistAction(userId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/catequistas')
  return null
}

export async function deleteCatechistAction(userId: string): Promise<ActionState> {
  const supabase = await getCoordinatorClient()
  if (!supabase) return { error: 'Acesso negado' }

  const admin = createSupabaseAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (target?.role === 'admin') return { error: 'O administrador não pode ser excluído' }

  const { count } = await admin
    .from('attendance_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('catechist_id', userId)

  if (count && count > 0) {
    return { error: 'Catequista possui chamadas registradas. Desative-o em vez de excluir.' }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/catequistas')
  return null
}
