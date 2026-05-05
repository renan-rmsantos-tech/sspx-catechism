import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/badge'
import { archiveClassAction } from './actions'

export default async function TurmasPage() {
  const supabase = await createSupabaseServerClient()

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name, schedule, level, is_archived')
    .order('is_archived')
    .order('name')

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar turmas.
      </div>
    )
  }

  const active = (classes ?? []).filter((c) => !c.is_archived)
  const archived = (classes ?? []).filter((c) => c.is_archived)

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Turmas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Gerencie as turmas e catequistas
          </p>
        </div>
        <Link
          href="/admin/turmas/new"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Turma
        </Link>
      </div>

      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ativas ({active.length})
          </h2>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma turma ativa.{' '}
            <Link href="/admin/turmas/new" style={{ color: 'var(--accent)' }}>
              Criar turma
            </Link>
          </div>
        ) : (
          <ul>
            {active.map((cls) => (
              <li
                key={cls.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {cls.name}
                  </p>
                  {cls.schedule && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {cls.schedule}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/turmas/${cls.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Editar
                  </Link>
                  <form
                    action={archiveClassAction.bind(null, cls.id) as (formData: FormData) => void}
                  >
                    <button
                      type="submit"
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Arquivar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {archived.length > 0 && (
        <div
          className="rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Arquivadas ({archived.length})
            </h2>
          </div>
          <ul>
            {archived.map((cls) => (
              <li
                key={cls.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {cls.name}
                  </p>
                </div>
                <Badge variant="default">Arquivada</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
