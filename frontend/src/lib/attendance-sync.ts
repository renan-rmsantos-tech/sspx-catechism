import { apiFetch } from '@/lib/api'
import type { AttendanceSyncResult, PendingSession } from '@/lib/attendance-types'
import { db } from '@/lib/db'

export const ATTENDANCE_SYNC_TAG = 'sync-attendance'

export async function enqueuePendingSession(session: PendingSession): Promise<void> {
  const existing = await db.pending_sessions
    .where('[classId+date]')
    .equals([session.classId, session.date])
    .first()

  if (existing) {
    await db.pending_sessions.put({ ...session, id: existing.id, createdAt: existing.createdAt })
    return
  }

  await db.pending_sessions.add(session)
}

export async function getPendingSessionCount(): Promise<number> {
  return db.pending_sessions.count()
}

export async function postAttendanceSessions(
  sessions: PendingSession[],
): Promise<AttendanceSyncResult> {
  return apiFetch<AttendanceSyncResult>('/api/attendance', {
    method: 'POST',
    json: { sessions },
  })
}

export async function syncPendingSessions(): Promise<AttendanceSyncResult> {
  const pending = await db.pending_sessions.orderBy('createdAt').toArray()
  if (pending.length === 0) return { synced: 0, skipped: 0 }

  const result = await postAttendanceSessions(pending)
  await db.pending_sessions.bulkDelete(pending.map((session) => session.id))
  return result
}

export async function submitAttendanceSession(
  session: PendingSession,
  online = typeof navigator === 'undefined' ? true : navigator.onLine,
): Promise<'synced' | 'queued'> {
  if (!online) {
    await enqueuePendingSession(session)
    await registerOneShotBackgroundSync()
    return 'queued'
  }

  try {
    await postAttendanceSessions([session])
    return 'synced'
  } catch (error) {
    if (isConnectivityError(error)) {
      await enqueuePendingSession(session)
      await registerOneShotBackgroundSync()
      return 'queued'
    }
    throw error
  }
}

export function registerAttendanceSyncHandlers(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    void syncPendingSessions().catch(() => undefined)
  })
  void registerOneShotBackgroundSync()
}

export async function registerOneShotBackgroundSync(): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('SyncManager' in window)
  ) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> }
    }
    await syncRegistration.sync.register(ATTENDANCE_SYNC_TAG)
  } catch {
    // The online event and explicit in-app sync cover browsers without Background Sync.
  }
}

function isConnectivityError(error: unknown): boolean {
  return error instanceof TypeError
}
