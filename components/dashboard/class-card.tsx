import Badge from '@/components/ui/badge'

interface ClassCardProps {
  id: string
  name: string
  schedule: string | null
  studentCount: number
  attendanceDone: boolean
  presencePercent: number
}

export default function ClassCard({
  id: _id,
  name,
  schedule,
  studentCount,
  attendanceDone,
  presencePercent,
}: ClassCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      data-testid="class-card"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3
          className="font-bold text-base leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </h3>
        <Badge variant={attendanceDone ? 'feita' : 'pendente'}>
          {attendanceDone ? 'Chamada feita' : 'Pendente'}
        </Badge>
      </div>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {schedule ? `${schedule} • ` : ''}
        {studentCount} aluno{studentCount !== 1 ? 's' : ''}
      </p>
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: '#E5E7EB' }}
        role="progressbar"
        aria-valuenow={presencePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${presencePercent}% de presença`}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${presencePercent}%`,
            backgroundColor: attendanceDone ? 'var(--accent)' : '#9CA3AF',
          }}
        />
      </div>
      <p
        className="text-sm mt-1 text-right font-medium"
        style={{ color: attendanceDone ? 'var(--accent)' : 'var(--text-secondary)' }}
      >
        {presencePercent}% presença
      </p>
    </div>
  )
}
