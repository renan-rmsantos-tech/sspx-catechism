import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import StudentForm from '@/components/admin/student-form'
import { updateStudentAction } from '../../actions'

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: student }, { data: classes }] = await Promise.all([
    supabase.from('students').select('*').eq('id', id).single(),
    supabase.from('classes').select('id, name').eq('is_archived', false).order('name'),
  ])

  if (!student) notFound()

  const boundUpdate = updateStudentAction.bind(null, id)

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
            Editar Aluno
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
        defaultValues={{
          class_id: student.class_id,
          full_name: student.full_name,
          birth_date: student.birth_date,
          city: student.city,
          first_communion: student.first_communion ?? false,
          confirmation: student.confirmation ?? false,
          previous_catechism: student.previous_catechism,
          religious_books: student.religious_books,
          guardian_father_name: student.guardian_father_name,
          guardian_mother_name: student.guardian_mother_name,
          guardian_phone: student.guardian_phone,
        }}
        action={boundUpdate}
        submitLabel="Salvar Alterações"
      />
    </div>
  )
}
