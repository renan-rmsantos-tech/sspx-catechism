import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'

// 3s was too tight: heavy admin renders occasionally exceed it on contended
// CI runners, producing flaky waitFor/findBy timeouts.
configure({ asyncUtilTimeout: 8000 })

// Global test isolation. Without this, stubbed globals (fetch) and the shared
// Dexie/IndexedDB tables leak across tests in the same file, so a later test
// starts in a polluted state — and CI retries re-run in that same polluted
// process, so they fail again. Reset everything after every test.
afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await Promise.all([db.pending_sessions.clear(), db.cached_class_dates.clear()])
})

// jsdom does not implement the object-URL statics; the blob-download flow
// (admin reports) calls them. Define no-op stubs so downloads don't throw.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}
