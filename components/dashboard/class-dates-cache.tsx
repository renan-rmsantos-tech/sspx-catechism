'use client'

import { useEffect } from 'react'
import { cacheClassDates } from '@/lib/class-dates/cache'

interface ClassDatesCacheProps {
  academicYearId: string
  dates: string[]
}

export default function ClassDatesCache({ academicYearId, dates }: ClassDatesCacheProps) {
  useEffect(() => {
    cacheClassDates(academicYearId, dates)
  }, [academicYearId, dates])

  return null
}
