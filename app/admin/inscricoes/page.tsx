import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import EnrollmentSearch from './enrollment-search'

type StatusFilter = 'pending' | 'approved' | 'rejected'

const STATUS_LABELS: Record<StatusFilter, string> = {
  pending: 'Pendentes',
  approved: 'Aprovadas',
  rejected: 'Rejeitadas',
}

const STATUS_COLORS: Record<
  StatusFilter,
  { bg: string; text: string; dot: string }
> = {
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  approved: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
}

function StatusBadge({ status }: { status: StatusFilter }) {
  const colors = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}

function RenewalBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
    >
      Renovação
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function InscricoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const currentStatus: StatusFilter =
    status === 'approved' || status === 'rejected' ? status : 'pending'

  const supabase = await createSupabaseServerClient()

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeYear) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        Nenhum ano letivo ativo encontrado.
      </div>
    )
  }

  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('academic_year_id', activeYear.id)

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
  }
  for (const e of allEnrollments ?? []) {
    if (e.status in counts) counts[e.status as StatusFilter]++
  }

  let query = supabase
    .from('enrollments')
    .select(
      'id, full_name, status, is_renewal, created_at'
    )
    .eq('academic_year_id', activeYear.id)
    .eq('status', currentStatus)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data: enrollments, error } = await query

  if (error) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        Erro ao carregar inscrições.
      </div>
    )
  }

  return (
    <div
      className="flex flex-col p-8 gap-6"
      style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}
    >
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Inscrições
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Gestão de inscrições na catequese
        </p>
      </div>

      {/* Counters */}
      <div className="flex gap-3">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => {
          const isActive = s === currentStatus
          const colors = STATUS_COLORS[s]
          return (
            <Link
              key={s}
              href={`/admin/inscricoes?status=${s}${q ? `&q=${q}` : ''}`}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? colors.bg : 'var(--surface)',
                color: isActive ? colors.text : 'var(--text-secondary)',
                border: `1.5px solid ${isActive ? colors.dot : 'var(--border)'}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.dot }}
              />
              {STATUS_LABELS[s]}
              <span className="font-bold">{counts[s]}</span>
            </Link>
          )
        })}
      </div>

      <Suspense>
        <EnrollmentSearch />
      </Suspense>

      {/* Enrollment list */}
      <div
        className="rounded-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
        }}
      >
        <div
          className="p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {q
              ? `Resultados para "${q}"`
              : STATUS_LABELS[currentStatus]}{' '}
            ({(enrollments ?? []).length})
          </h2>
        </div>

        {(enrollments ?? []).length === 0 ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {q
              ? 'Nenhuma inscrição encontrada.'
              : `Nenhuma inscrição ${STATUS_LABELS[currentStatus].toLowerCase()}.`}
          </div>
        ) : (
          <ul>
            {(enrollments ?? []).map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {enrollment.full_name}
                    </p>
                    {enrollment.is_renewal && <RenewalBadge />}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Enviada em {formatDate(enrollment.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={enrollment.status as StatusFilter}
                  />
                  <Link
                    href={`/admin/inscricoes/${enrollment.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Ver detalhes
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
