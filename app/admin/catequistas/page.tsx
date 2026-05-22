import { createSupabaseServerClient } from '@/lib/supabase/server'
import CatechistsView, { type CatechistRow } from '@/components/admin/catechists-view'

export default async function CatequistasPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .in('role', ['catechist', 'coordinator', 'admin'])
    .order('full_name')

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar catequistas.
      </div>
    )
  }

  const profileIds = (profiles ?? []).map((p) => p.id)

  const { data: assignments } = profileIds.length > 0
    ? await supabase
        .from('class_catechists')
        .select('catechist_id, class_id')
        .in('catechist_id', profileIds)
    : { data: [] }

  const classIds = [...new Set((assignments ?? []).map((a) => a.class_id))]
  const { data: classes } = classIds.length > 0
    ? await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)
    : { data: [] }

  const classNameMap: Record<string, string> = {}
  for (const cls of classes ?? []) {
    classNameMap[cls.id] = cls.name
  }

  const catechistClassesMap: Record<string, string[]> = {}
  for (const a of assignments ?? []) {
    const name = classNameMap[a.class_id]
    if (name) {
      catechistClassesMap[a.catechist_id] = [
        ...(catechistClassesMap[a.catechist_id] ?? []),
        name,
      ]
    }
  }

  const rows: CatechistRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role as 'coordinator' | 'catechist' | 'admin',
    is_active: p.is_active ?? true,
    classes: catechistClassesMap[p.id] ?? [],
    created_at: p.created_at,
  }))

  return <CatechistsView catechists={rows} currentUserId={user?.id ?? ''} />
}
