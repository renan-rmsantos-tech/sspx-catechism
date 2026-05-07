import Link from 'next/link'

interface AttendanceBlockedProps {
  className: string
  formattedDate: string
}

export default function AttendanceBlocked({ className, formattedDate }: AttendanceBlockedProps) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ backgroundColor: '#78350F' }}
      >
        <p className="text-sm font-medium text-white/70">{formattedDate}</p>
        <h1 className="text-xl font-extrabold text-white mt-1">{className}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text-secondary)' }}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="7" y1="15" x2="17" y2="15" />
        </svg>
        <h2
          className="text-lg font-bold mt-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Sem aula hoje
        </h2>
        <p
          className="text-sm mt-2 max-w-[280px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Hoje não é um dia de aula programado. A chamada só pode ser registrada nos sábados definidos no calendário letivo.
        </p>
      </div>

      {/* Back button */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full py-4 rounded-2xl text-base font-bold"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--border)',
            minHeight: '56px',
          }}
        >
          Voltar
        </Link>
      </div>
    </div>
  )
}
