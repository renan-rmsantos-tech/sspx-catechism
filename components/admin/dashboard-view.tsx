import Badge from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export interface ClassRow {
  id: string
  name: string
  schedule: string | null
  catechists: string[]
  studentCount: number
  attendancePercent: number
  hasSessionToday: boolean
}

export interface DashboardStats {
  activeClasses: number
  totalStudents: number
  avgAttendance: number
  sessionsToday: number
  totalClasses: number
}

export interface DashboardViewProps {
  stats: DashboardStats
  classes: ClassRow[]
  academicYearLabel: string
  dateLabel: string
  isScheduledDay: boolean
}

function AttendanceBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--accent-track)' }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: percent >= 75 ? 'var(--accent)' : percent >= 50 ? '#D97706' : '#DC2626',
          }}
        />
      </div>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {percent}%
      </span>
    </div>
  )
}

export default function DashboardView({
  stats,
  classes,
  academicYearLabel,
  dateLabel,
  isScheduledDay,
}: DashboardViewProps) {
  return (
    <div className="flex flex-col h-full p-8 gap-6" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Topbar */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Visão Geral
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {academicYearLabel} · {dateLabel}
          </p>
        </div>
        <a
          href="/admin/alunos/novo"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Aluno
        </a>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4" data-testid="stats-row">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            Turmas Ativas
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.activeClasses}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            Total de Alunos
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalStudents}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            Presença Média
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--accent)' }}>
            {stats.avgAttendance}%
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            Chamadas Hoje
          </p>
          {isScheduledDay ? (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.sessionsToday}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                de {stats.totalClasses}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sem aula hoje
            </p>
          )}
        </Card>
      </div>

      {/* Table Area */}
      <div
        className="flex-1 rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Turmas
          </h2>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Buscar turma…
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma turma ativa. <a href="/admin/turmas/new" style={{ color: 'var(--accent)' }}>Criar turma</a>
          </div>
        ) : (
          <table className="w-full" data-testid="classes-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider w-56" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Turma
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider w-36" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Catequista
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider w-24" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Alunos
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider w-36" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Presença
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Chamada Hoje
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr
                  key={cls.id}
                  data-testid={`class-row-${cls.id}`}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="py-4 pr-4">
                    <a
                      href={`/admin/turmas/${cls.id}`}
                      className="block hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="text-sm font-medium">{cls.name}</div>
                      {cls.schedule && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {cls.schedule}
                        </div>
                      )}
                    </a>
                  </td>
                  <td className="py-4 pr-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {cls.catechists.length > 0 ? cls.catechists.join(', ') : '—'}
                  </td>
                  <td className="py-4 pr-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {cls.studentCount}
                  </td>
                  <td className="py-4 pr-4">
                    <AttendanceBar percent={cls.attendancePercent} />
                  </td>
                  <td className="py-4">
                    {isScheduledDay ? (
                      <Badge variant={cls.hasSessionToday ? 'feita' : 'pendente'} />
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
