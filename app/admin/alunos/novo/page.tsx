import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import StudentForm from '@/components/admin/student-form'
import { createStudentAction } from '../actions'

export default async function NovoAlunoPage() {
  const supabase = await createSupabaseServerClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('is_archived', false)
    .order('name')

  return (
    <div
      className="p-8"
      style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/alunos"
            className="text-sm hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Alunos
          </Link>
          <h1
            className="mt-2 text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Novo Aluno
          </h1>
        </div>
        <Link
          href="/admin/alunos"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            border: '1.5px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        >
          Cancelar
        </Link>
      </div>

      <StudentForm
        classes={classes ?? []}
        action={createStudentAction}
        submitLabel="Salvar Aluno"
      />
    </div>
  )
}
