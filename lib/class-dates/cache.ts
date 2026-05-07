import { db } from '@/lib/db'

export async function cacheClassDates(academicYearId: string, dates: string[]): Promise<void> {
  await db.cached_class_dates.where('academic_year_id').equals(academicYearId).delete()
  if (dates.length > 0) {
    await db.cached_class_dates.bulkAdd(
      dates.map((date) => ({ academic_year_id: academicYearId, date }))
    )
  }
}

export async function isDateScheduledOffline(academicYearId: string, date: string): Promise<boolean> {
  const entry = await db.cached_class_dates.get([academicYearId, date])
  return !!entry
}
