import { cn } from '@/lib/utils'
type BrandProps = { compact?: boolean; className?: string; markHeight?: number; onInk?: boolean }

function Brand({ compact = false, className, markHeight = 33, onInk = false }: BrandProps) {
  const reduced = markHeight < 20
  return <div className={cn('inline-flex items-center gap-2 text-accent-ink [--mk-field:var(--surface)]', onInk && 'text-surface [--mk-field:var(--accent-ink)]', className)} aria-label="Catequese SSPX">
    {reduced ? <img className="w-auto" style={{ height: markHeight }} src="/favicon.svg" alt="" aria-hidden="true" /> : <svg className="block shrink-0" style={{ height: markHeight, width: markHeight * (40 / 51) }} viewBox="0 0 40 51" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1 1 H39 V25 C39 37.5 29.8 45.4 20 49.5 C10.2 45.4 1 37.5 1 25 Z" /><path fill="var(--mk-field)" d="M20 8 L22.6 11 L22.6 18 L30.4 18 L33.4 20.8 L30.4 23.6 L22.6 23.6 L22.6 38.5 L20 41.5 L17.4 38.5 L17.4 23.6 L9.6 23.6 L6.6 20.8 L9.6 18 L17.4 18 L17.4 11 Z" /><path fill="none" stroke="var(--gold)" strokeWidth="1.2" d="M5 5 H35 V24.6 C35 34.6 27.6 41.3 20 45 C12.4 41.3 5 34.6 5 24.6 Z" /></svg>}
    <span className={cn('wordmark text-sm leading-none', compact && 'sr-only')}>Catequese SSPX</span>
  </div>
}
export { Brand }
