import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function formatSessionDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ChamadasPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: classes, error: classesError }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      supabase
        .from('classes')
        .select('id, name, schedule, is_archived')
        .eq('is_archived', false)
        .order('name'),
      supabase
        .from('attendance_sessions')
        .select(
          `
          id,
          date,
          class_id,
          catechist_id,
          classes ( name ),
          attendance_records ( present )
        `,
        )
        .order('date', { ascending: false })
        .limit(75),
    ])

  if (classesError || sessionsError) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar chamadas.
      </div>
    )
  }

  const activeClasses = classes ?? []

  const catechistIds = [...new Set((sessions ?? []).map((s) => s.catechist_id))]
  const { data: catechistProfiles } =
    catechistIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', catechistIds)
      : { data: [] }

  const nameByCatechist = Object.fromEntries(
    (catechistProfiles ?? []).map((p) => [p.id, p.full_name]),
  )

  return (
    <div className="flex flex-col p-8 gap-8" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Chamadas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Histórico recente e acesso por turma
        </p>
      </div>

      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Por turma
          </h2>
        </div>
        {activeClasses.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma turma ativa.{' '}
            <Link href="/admin/turmas/new" style={{ color: 'var(--accent)' }}>
              Criar turma
            </Link>
          </div>
        ) : (
          <ul>
            {activeClasses.map((cls) => (
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
                <Link
                  href={`/admin/chamadas/${cls.id}`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Ver histórico
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Registos recentes
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Últimas {sessions?.length ?? 0} chamadas registadas
          </p>
        </div>
        {!sessions?.length ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ainda não há chamadas registadas.
          </div>
        ) : (
          <ul>
            {sessions.map((s) => {
              const className =
                s.classes && typeof s.classes === 'object' && 'name' in s.classes
                  ? String((s.classes as { name: string }).name)
                  : 'Turma'
              const records = Array.isArray(s.attendance_records) ? s.attendance_records : []
              const present = records.filter((r) => r.present).length
              const total = records.length
              const catechistName = nameByCatechist[s.catechist_id] ?? '—'

              return (
                <li
                  key={s.id}
                  className="px-5 py-4"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/admin/chamadas/${s.class_id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {className}
                    </Link>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatSessionDate(s.date)}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Catequista: {catechistName}
                    {total > 0 ? (
                      <>
                        {' · '}
                        Presenças: {present}/{total}
                      </>
                    ) : null}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
