import { createSupabaseServerClient } from '@/lib/supabase/server'
import RelatoriosForm from '@/components/admin/relatorios-form'

export default async function RelatoriosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('is_archived', false)
    .order('name')

  return (
    <div
      className="flex flex-col p-8 gap-6"
      style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}
    >
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          Relatórios
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Exporte relatórios de presença por turma e período
        </p>
      </div>

      <RelatoriosForm classes={classes ?? []} />
    </div>
  )
}
