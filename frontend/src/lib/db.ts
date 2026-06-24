import Dexie, { type Table } from 'dexie'
import type { PendingSession } from '@/lib/attendance-types'

export interface CachedClassDate {
  academicYearId: string
  date: string
}

export class CatechismDB extends Dexie {
  pending_sessions!: Table<PendingSession, string>
  cached_class_dates!: Table<CachedClassDate, [string, string]>

  constructor(name = 'catechism') {
    super(name)
    this.version(1).stores({
      pending_sessions: 'id, &[classId+date], classId, date, catechistId, createdAt',
      cached_class_dates: '[academicYearId+date], academicYearId, date',
    })
  }
}

export const db = new CatechismDB()
