import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function formatSessionDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ChamadasTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: classId } = await params
  const supabase = await createSupabaseServerClient()

  const { data: cls } = await supabase.from('classes').select('id, name, schedule').eq('id', classId).single()

  if (!cls) notFound()

  const { data: sessions, error } = await supabase
    .from('attendance_sessions')
    .select(
      `
      id,
      date,
      catechist_id,
      attendance_records ( present )
    `,
    )
    .eq('class_id', classId)
    .order('date', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Erro ao carregar chamadas desta turma.
      </div>
    )
  }

  const catechistIds = [...new Set((sessions ?? []).map((s) => s.catechist_id))]
  const { data: catechistProfiles } =
    catechistIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', catechistIds)
      : { data: [] }

  const nameByCatechist = Object.fromEntries(
    (catechistProfiles ?? []).map((p) => [p.id, p.full_name]),
  )

  return (
    <div className="flex flex-col p-8 gap-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div>
        <Link href="/admin/chamadas" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
          ← Voltar às chamadas
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Chamadas · {cls.name}
        </h1>
        {cls.schedule && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {cls.schedule}
          </p>
        )}
      </div>

      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        {!sessions?.length ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma chamada registada para esta turma.
          </div>
        ) : (
          <ul>
            {sessions.map((s) => {
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
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatSessionDate(s.date)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Catequista: {catechistName}
                    {total > 0 ? (
                      <>
                        {' · '}
                        Presenças: {present}/{total}
                      </>
                    ) : (
                      ' · Sem registos de alunos'
                    )}
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
