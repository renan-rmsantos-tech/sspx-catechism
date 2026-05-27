import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ApproveForm from './approve-form'
import RejectForm from './reject-form'

function DataField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {value || '—'}
      </p>
    </div>
  )
}

function BooleanField({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {value ? 'Sim' : 'Não'}
      </p>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-4"
      style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
    >
      {title}
    </p>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_DISPLAY: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendente', bg: '#FEF3C7', text: '#92400E' },
  approved: { label: 'Aprovada', bg: '#DCFCE7', text: '#166534' },
  rejected: { label: 'Rejeitada', bg: '#FEE2E2', text: '#991B1B' },
}

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', id)
    .single()

  if (!enrollment) notFound()

  const isPending = enrollment.status === 'pending'
  const statusInfo = STATUS_DISPLAY[enrollment.status] ?? STATUS_DISPLAY.pending

  const { data: classes } = isPending
    ? await supabase
        .from('classes')
        .select('id, name')
        .eq('academic_year_id', enrollment.academic_year_id)
        .eq('is_archived', false)
        .order('name')
    : { data: null }

  let approvedClassName: string | null = null
  if (enrollment.status === 'approved' && enrollment.approved_class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('id', enrollment.approved_class_id)
      .single()
    approvedClassName = cls?.name ?? null
  }

  let reviewerName: string | null = null
  if (enrollment.reviewed_by) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', enrollment.reviewed_by)
      .single()
    reviewerName = reviewer?.full_name ?? null
  }

  let existingStudents: { id: string; full_name: string }[] = []
  if (isPending && enrollment.is_renewal) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name')
      .order('full_name')
    existingStudents = data ?? []
  }

  return (
    <div className="p-8" style={{ backgroundColor: 'var(--bg)', minHeight: '100%' }}>
      <div className="mb-6">
        <Link
          href="/admin/inscricoes"
          className="text-sm hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Inscrições
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            {enrollment.full_name}
          </h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
          >
            {statusInfo.label}
          </span>
          {enrollment.is_renewal && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              Renovação
            </span>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enviada em {formatDateTime(enrollment.created_at)}
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Dados do Catequizando */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <SectionHeader title="Dados do Catequizando" />
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Nome Completo" value={enrollment.full_name} />
            <DataField label="Data de Nascimento" value={formatDate(enrollment.birth_date)} />
            <DataField label="Cidade" value={enrollment.city} />
            <BooleanField label="Primeira Comunhão" value={enrollment.first_communion} />
            <BooleanField label="Crisma" value={enrollment.confirmation} />
            <DataField label="Catequese anterior" value={enrollment.previous_catechism} />
            <DataField label="Livros de religião" value={enrollment.religious_books} />
          </div>
        </div>

        {/* Dados do Responsável */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <SectionHeader title="Dados do Responsável" />
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Nome do Pai" value={enrollment.guardian_father_name} />
            <DataField label="Nome da Mãe / Responsável" value={enrollment.guardian_mother_name} />
            <DataField label="Telefone" value={enrollment.guardian_phone} />
            <DataField label="Email" value={enrollment.guardian_email} />
          </div>
        </div>

        {/* Renovação */}
        {enrollment.is_renewal && (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
          >
            <SectionHeader title="Renovação" />
            <DataField label="Nome anterior cadastrado" value={enrollment.previous_name} />
          </div>
        )}

        {/* Resultado (processed) */}
        {!isPending && (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
          >
            <SectionHeader title="Resultado" />
            <div className="flex flex-col gap-3">
              {enrollment.status === 'approved' && approvedClassName && (
                <DataField label="Turma atribuída" value={approvedClassName} />
              )}
              {enrollment.status === 'rejected' && (
                <DataField
                  label="Motivo da rejeição"
                  value={enrollment.rejection_reason || 'Nenhum motivo informado'}
                />
              )}
              <DataField label="Revisado por" value={reviewerName} />
              <DataField label="Data da revisão" value={formatDateTime(enrollment.reviewed_at)} />
            </div>
          </div>
        )}

        {/* Actions (pending only) */}
        {isPending && (
          <div className="flex flex-col gap-4">
            <ApproveForm
              enrollmentId={enrollment.id}
              classes={classes ?? []}
              isRenewal={enrollment.is_renewal ?? false}
              existingStudents={existingStudents}
            />
            <RejectForm enrollmentId={enrollment.id} />
          </div>
        )}
      </div>
    </div>
  )
}
