export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await seedAdmin()
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('[seed] ADMIN_EMAIL ou ADMIN_PASSWORD não definidas — admin não será provisionado')
    return
  }

  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server')
    const admin = createSupabaseAdminClient()

    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email === email)

    if (existing) {
      await admin.from('profiles').upsert(
        { id: existing.id, full_name: 'Administrador', role: 'admin' },
        { onConflict: 'id' },
      )
      console.log('[seed] Admin já existe — profile garantido')
      return
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Administrador', role: 'admin' },
    })

    if (error) {
      console.error('[seed] Erro ao criar admin:', error.message)
      return
    }

    await admin.from('profiles').upsert(
      { id: data.user.id, full_name: 'Administrador', role: 'admin' },
      { onConflict: 'id' },
    )

    console.log('[seed] Admin criado com sucesso:', email)
  } catch (err) {
    console.error('[seed] Falha ao provisionar admin:', err)
  }
}
