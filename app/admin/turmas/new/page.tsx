import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ClassForm from '@/components/admin/class-form'
import { createClassAction } from '../actions'

export default async function NewTurmaPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: academicYears }, { data: catechists }] = await Promise.all([
    supabase.from('academic_years').select('*').order('year', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role, created_at').eq('role', 'catechist').order('full_name'),
  ])

  return (
    <div className="p-8 max-w-lg" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div className="mb-6">
        <Link
          href="/admin/turmas"
          className="text-sm hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Nova Turma
        </h1>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <ClassForm
          academicYears={academicYears ?? []}
          catechists={catechists ?? []}
          action={createClassAction}
          submitLabel="Criar Turma"
        />
      </div>
    </div>
  )
}
