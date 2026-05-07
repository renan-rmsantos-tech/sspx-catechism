'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { logoutAction } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/admin',
    label: 'Visão Geral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/turmas',
    label: 'Turmas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/alunos',
    label: 'Alunos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/admin/chamadas',
    label: 'Chamadas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: '/admin/relatorios',
    label: 'Relatórios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/dashboard'
  return pathname.startsWith(href)
}

export interface SidebarProps {
  userName?: string
  userRole?: string
  userInitials?: string
}

export default function Sidebar({
  userName = 'Coordenador',
  userRole = 'Coordenador',
  userInitials = 'CO',
}: SidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <aside
      data-testid="sidebar"
      className="hidden lg:flex flex-col w-60 shrink-0 py-8"
      style={{ backgroundColor: 'var(--sidebar-bg)', minHeight: '100vh' }}
    >
      {/* Header */}
      <div className="px-6 pb-10">
        <div
          className="text-white font-extrabold text-xl"
          style={{ letterSpacing: '-0.02em', lineHeight: '24px' }}
        >
          Catequese
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '16px' }}>
          Paróquia São José
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Navegação principal">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={cn(
                'sidebar-nav-item flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm transition-colors',
                active
                  ? 'sidebar-nav-item-active font-semibold text-white'
                  : 'font-normal hover:bg-white/5',
              )}
              style={
                active
                  ? { backgroundColor: 'rgba(180, 83, 9, 0.15)', color: '#FFFFFF' }
                  : { color: 'rgba(255,255,255,0.5)' }
              }
              aria-current={active ? 'page' : undefined}
            >
              <span
                className="shrink-0"
                style={{ stroke: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)' }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto px-3">
        <div
          className="flex items-center gap-2.5 pt-5 pb-[11px] px-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full text-white text-[13px] font-bold"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-white leading-[18px] truncate">{userName}</span>
            <span className="text-[11px] leading-4 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {userRole}
            </span>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => logoutAction())}
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/10 disabled:opacity-50"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Sair"
            title="Sair"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
