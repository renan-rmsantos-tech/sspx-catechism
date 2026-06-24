/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ATTENDANCE_SYNC_TAG, syncPendingSessions } from '@/lib/attendance-sync'

declare let self: ServiceWorkerGlobalScope

interface SyncEvent extends ExtendableEvent {
  readonly tag: string
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEvent
  if (syncEvent.tag !== ATTENDANCE_SYNC_TAG) return
  syncEvent.waitUntil(syncPendingSessions())
})
