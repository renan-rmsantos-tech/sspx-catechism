import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import StudentSearch from '@/components/admin/student-search'

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('students')
    .select('id, full_name, birth_date, city, class_id, classes(name)')
    .order('full_name')

  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data: students, error } = await query

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar alunos.
      </div>
    )
  }

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Alunos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Cadastro e gestão de alunos
          </p>
        </div>
        <Link
          href="/admin/alunos/novo"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Aluno
        </Link>
      </div>

      <Suspense>
        <StudentSearch />
      </Suspense>

      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {q ? `Resultados para "${q}"` : 'Todos os alunos'} ({students?.length ?? 0})
          </h2>
        </div>

        {!students || students.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            {q ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}{' '}
            {!q && (
              <Link href="/admin/alunos/novo" style={{ color: 'var(--accent)' }}>
                Cadastrar aluno
              </Link>
            )}
          </div>
        ) : (
          <ul>
            {students.map((student) => {
              const cls = student.classes as unknown as { name: string } | null
              return (
                <li
                  key={student.id}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {student.full_name}
                    </p>
                    {cls?.name && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {cls.name}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/alunos/${student.id}/editar`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Editar
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
