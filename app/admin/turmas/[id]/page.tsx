import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ClassForm from '@/components/admin/class-form'
import { updateClassAction, archiveClassAction } from '../actions'

export default async function EditTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [
    { data: cls },
    { data: academicYears },
    { data: catechists },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('classes').select('*').eq('id', id).single(),
    supabase.from('academic_years').select('*').order('year', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, role, is_active, created_at')
      .eq('role', 'catechist')
      .order('full_name'),
    supabase.from('class_catechists').select('catechist_id').eq('class_id', id),
  ])

  if (!cls) notFound()

  const catechistIds = (assignments ?? []).map((a) => a.catechist_id)
  const boundUpdate = updateClassAction.bind(null, id)

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
          Editar Turma
        </h1>
        {cls.is_archived && (
          <span className="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F3F4F6', color: 'var(--text-secondary)' }}>
            Arquivada
          </span>
        )}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <ClassForm
          academicYears={academicYears ?? []}
          catechists={catechists ?? []}
          defaultValues={{
            name: cls.name,
            academic_year_id: cls.academic_year_id,
            level: cls.level ?? undefined,
            schedule: cls.schedule ?? undefined,
            catechist_ids: catechistIds,
          }}
          action={boundUpdate}
          submitLabel="Salvar Alterações"
        />

        {!cls.is_archived && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <form action={archiveClassAction.bind(null, id) as (formData: FormData) => void}>
              <button
                type="submit"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                Arquivar turma
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
