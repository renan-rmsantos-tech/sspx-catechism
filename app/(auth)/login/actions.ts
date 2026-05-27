'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Erro ao obter usuário após login.' }
  }

  const admin = createSupabaseAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[login] profile query', { userId: user.id, role: profile?.role, error: profileError?.message })

  const role = profile?.role
  const target = isCoordinatorOrAdmin(role) ? '/admin' : '/dashboard'
  console.log('[login] redirecting to', target)
  redirect(target)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
