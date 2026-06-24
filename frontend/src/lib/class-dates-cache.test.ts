import { cacheClassDates, isDateScheduledOffline } from '@/lib/class-dates-cache'
import { db } from '@/lib/db'

describe('class date cache', () => {
  beforeEach(async () => {
    await db.cached_class_dates.clear()
  })

  afterEach(async () => {
    await db.cached_class_dates.clear()
  })

  it('replaces cached class dates for an academic year', async () => {
    await cacheClassDates('year-1', ['2026-03-07'])
    await cacheClassDates('year-1', ['2026-03-14'])

    await expect(isDateScheduledOffline('year-1', '2026-03-07')).resolves.toBe(false)
    await expect(isDateScheduledOffline('year-1', '2026-03-14')).resolves.toBe(true)
  })
})
