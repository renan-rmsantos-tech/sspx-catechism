import type { HTMLAttributes, TableHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div data-slot="table-wrap" className={cn('overflow-x-auto rounded-[var(--r-lg)] border border-border', className)} {...props} /> }
function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn('w-full min-w-[620px] border-collapse text-left text-sm [&_th]:bg-surface-2 [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[.1em] [&_th]:text-muted [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-3', className)} {...props} /> }
export { Table, TableWrap }
