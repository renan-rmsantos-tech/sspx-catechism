'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

export default function EnrollmentSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)
  }

  return (
    <input
      type="search"
      defaultValue={searchParams.get('q') ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Buscar inscrição por nome..."
      className="w-full rounded-lg px-4 py-2.5 text-sm"
      style={{
        border: '1.5px solid var(--border)',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)',
        outline: 'none',
      }}
      aria-label="Buscar inscrição por nome"
    />
  )
}
