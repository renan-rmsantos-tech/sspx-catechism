import { cn } from '@/lib/utils'
function Brand({ compact = false, className }: { compact?: boolean; className?: string }) { return <div className={cn('inline-flex items-center gap-2 text-fg', className)} aria-label="Catequese SSPX"><img className="size-8" src="/favicon.svg" alt="" aria-hidden="true" /><span className={cn('wordmark text-sm leading-none', compact && 'sr-only')}>Catequese SSPX</span></div> }
export { Brand }
