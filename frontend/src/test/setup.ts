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

// The blob-download flow (admin reports) calls URL.createObjectURL/
// revokeObjectURL. Stub them UNCONDITIONALLY: depending on the Node version,
// the global may be missing (jsdom) OR a real implementation that rejects a
// jsdom Blob and throws — which silently breaks the download and only shows up
// on CI (Node 22) while passing locally (newer Node). A fixed stub is
// environment-independent. defineProperty handles a non-writable existing one.
Object.defineProperty(URL, 'createObjectURL', {
  value: () => 'blob:mock',
  writable: true,
  configurable: true,
})
Object.defineProperty(URL, 'revokeObjectURL', {
  value: () => {},
  writable: true,
  configurable: true,
})
