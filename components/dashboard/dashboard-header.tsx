'use client'

import { useTransition } from 'react'
import { logoutAction } from '@/app/(auth)/login/actions'

export default function DashboardHeader() {
  const [isPending, startTransition] = useTransition()

  return (
    <header
      data-testid="dashboard-header"
      className="flex items-center justify-between px-6 pt-2 pb-4 bg-white"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <h1
        className="text-xl font-extrabold"
        style={{ color: 'var(--accent)', letterSpacing: '-0.01em' }}
      >
        Catequese
      </h1>
      <div className="flex items-center gap-1">
        <div
          className="flex w-9 h-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--accent-light)' }}
          aria-label="Perfil do usuário"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: 'var(--accent)' }}
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => logoutAction())}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-50"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Sair"
          title="Sair"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  )
}
