import type { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { createCatechistSchema } from '@/lib/classes/schemas'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

const WORDS = [
  'sol', 'lua', 'mar', 'rio', 'luz', 'paz', 'flor', 'cafe', 'neve', 'rosa',
  'vida', 'arte', 'mel', 'ceu', 'dia', 'lar', 'rei', 'som', 'cor', 'asa',
  'fogo', 'pao', 'uva', 'ovo', 'cha', 'bem', 'dom', 'fio', 'giz', 'lei',
]

function generateSimplePassword(): string {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  const digits = String(Math.floor(Math.random() * 90) + 10)
  return `${pick()}-${pick()}-${pick()}${digits}`
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

  const result = createCatechistSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 })
  }

  const { email, full_name } = result.data
  const password = generateSimplePassword()
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'catechist' },
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  await admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', data.user.id)

  return Response.json({ id: data.user.id, email: data.user.email, password }, { status: 201 })
}
