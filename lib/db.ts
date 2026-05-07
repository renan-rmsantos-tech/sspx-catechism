import Dexie, { type Table } from 'dexie'
import type { PendingSession } from './attendance/schemas'

export interface CachedClassDate {
  academic_year_id: string
  date: string
}

class CatechismDB extends Dexie {
  pending_sessions!: Table<PendingSession, string>
  cached_class_dates!: Table<CachedClassDate, [string, string]>

  constructor() {
    super('catechism')
    this.version(1).stores({
      pending_sessions: 'id, classId, date, catechistId, createdAt',
    })
    this.version(2).stores({
      pending_sessions: 'id, classId, date, catechistId, createdAt',
      cached_class_dates: '[academic_year_id+date], academic_year_id',
    })
  }
}

export const db = new CatechismDB()
