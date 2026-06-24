import { db } from '@/lib/db'

export async function cacheClassDates(academicYearId: string, dates: string[]): Promise<void> {
  await db.transaction('rw', db.cached_class_dates, async () => {
    await db.cached_class_dates.where('academicYearId').equals(academicYearId).delete()
    if (dates.length > 0) {
      await db.cached_class_dates.bulkPut(
        dates.map((date) => ({ academicYearId, date })),
      )
    }
  })
}

export async function isDateScheduledOffline(academicYearId: string, date: string): Promise<boolean> {
  const entry = await db.cached_class_dates.get([academicYearId, date])
  return !!entry
}
