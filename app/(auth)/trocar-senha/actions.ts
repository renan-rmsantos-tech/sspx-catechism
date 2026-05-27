'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export async function changePasswordAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sessão expirada. Faça login novamente.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'Erro ao atualizar a senha. Tente novamente.' }
  }

  const admin = createSupabaseAdminClient()
  await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id)

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  redirect(isCoordinatorOrAdmin(profile?.role) ? '/admin' : '/dashboard')
}
