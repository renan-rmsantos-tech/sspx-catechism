import { db } from '@/lib/db'
import {
  enqueuePendingSession,
  getPendingSessionCount,
  submitAttendanceSession,
  syncPendingSessions,
} from '@/lib/attendance-sync'
import type { PendingSession } from '@/lib/attendance-types'

const session = (overrides: Partial<PendingSession> = {}): PendingSession => ({
  id: crypto.randomUUID(),
  classId: '11111111-1111-1111-1111-111111111111',
  date: '2026-03-07',
  catechistId: '22222222-2222-2222-2222-222222222222',
  records: [{ studentId: '33333333-3333-3333-3333-333333333333', present: true }],
  createdAt: 1,
  ...overrides,
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('attendance offline sync', () => {
  beforeEach(async () => {
    await db.pending_sessions.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(async () => {
    await db.pending_sessions.clear()
    vi.restoreAllMocks()
  })

  it('queues offline sessions and deduplicates the class/date key', async () => {
    const first = session({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', createdAt: 10 })
    const duplicate = session({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      createdAt: 20,
      records: [{ studentId: '44444444-4444-4444-4444-444444444444', present: false }],
    })

    await submitAttendanceSession(first, false)
    await enqueuePendingSession(duplicate)

    expect(await getPendingSessionCount()).toBe(1)
    const stored = await db.pending_sessions.toArray()
    expect(stored[0]).toMatchObject({
      id: first.id,
      classId: first.classId,
      date: first.date,
      createdAt: first.createdAt,
      records: duplicate.records,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('flushes queued sessions and clears them after the API accepts the batch', async () => {
    const queued = session()
    await enqueuePendingSession(queued)
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ synced: 1, skipped: 0 }))

    await expect(syncPendingSessions()).resolves.toEqual({ synced: 1, skipped: 0 })

    expect(fetch).toHaveBeenCalledWith(
      '/api/attendance',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({
      sessions: [queued],
    })
    expect(await getPendingSessionCount()).toBe(0)
  })

  it('keeps the queue when the API rejects the batch', async () => {
    await enqueuePendingSession(session())
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'bad' }, 500))

    await expect(syncPendingSessions()).rejects.toThrow('bad')

    expect(await getPendingSessionCount()).toBe(1)
  })

  it('queues a nominally online submit when fetch fails with a connectivity error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('failed to fetch'))

    await expect(submitAttendanceSession(session(), true)).resolves.toBe('queued')

    expect(await getPendingSessionCount()).toBe(1)
  })
})
