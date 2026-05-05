# Task Memory: task_08.md

## Objective Snapshot

Implemented offline-first PWA: `@ducanh2912/next-pwa` + Dexie.js IndexedDB + Background Sync fallback + OfflineBanner + PendingSyncIndicator. **COMPLETE**.

## Important Decisions

- Used `@ducanh2912/next-pwa@10.2.9` (maintained fork) instead of original `next-pwa` (unmaintained, incompatible with Next.js 16). Configured in `next.config.ts` with `disable: process.env.NODE_ENV !== 'production'` so SW is only active in prod.
- `registerBackgroundSync()` always registers `window.addEventListener('online', ...)` (iOS/Safari), AND additionally tries Background Sync API if available (Chrome/Android). Double sync is idempotent.
- `syncPendingSessions()` only deletes from IndexedDB if `res.ok` — preserves data on 5xx.
- `SyncManager` type cast required: `reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }` — not in standard TS lib.
- `OfflineBanner` uses `useState(() => !navigator.onLine)` to initialize synchronously from `navigator.onLine` (no useEffect async delay for initial render).
- Test mocking strategy: `vi.mock()` with `vi.fn()` in factory (lazy, avoids hoisting TDZ issues). Then `vi.resetModules()` + `await import()` in each test to get fresh references.
- `lib/db.ts` coverage is 0% (Dexie never instantiated in tests — always mocked). Global coverage still 90.33%.

## Learnings

- Vitest `vi.mock()` factory is lazy (called when module is first imported, not at hoist time). Variables in the factory can safely reference module-level consts because the factory runs after module initialization.
- `vi.resetModules()` + `await import('../lib/db')` + `await import('../lib/attendance-sync')` in the same test: the second import sees the first import in the cache, so they share the same mock db. Essential for testing sync functions.
- `components/dashboard/attendance-sheet.tsx` needed mocks for `@/lib/db` and `@/lib/attendance-sync` to prevent Dexie/serviceWorker errors in jsdom.

## Files / Surfaces

- `next.config.ts` — wrapped with `@ducanh2912/next-pwa`
- `public/manifest.json` — amber theme, icons point to `/icons/icon-192.png`, `/icons/icon-512.png` (icons not yet created)
- `lib/db.ts` — `CatechismDB extends Dexie` with `pending_sessions: Table<PendingSession, string>`
- `lib/attendance-sync.ts` — `syncPendingSessions()` + `registerBackgroundSync()`
- `components/dashboard/attendance-sheet.tsx` — offline submit path, `registerBackgroundSync` in useEffect
- `components/offline-banner.tsx` — reads `navigator.onLine` synchronously, listens to online/offline events
- `components/pending-sync-indicator.tsx` — counts `db.pending_sessions` in useEffect, refreshes on 'online' event
- `app/layout.tsx` — added `manifest: '/manifest.json'` to metadata
- `app/dashboard/page.tsx` — added `<OfflineBanner />` + `<PendingSyncIndicator />`
- `__tests__/attendance-sync.test.ts` — 10 unit + integration tests for syncPendingSessions
- `__tests__/components/offline-banner.test.tsx` — 5 tests for OfflineBanner
- `__tests__/components/pending-sync-indicator.test.tsx` — 5 tests for PendingSyncIndicator
- `__tests__/components/attendance-sheet.test.tsx` — 3 new offline tests added

## Errors / Corrections

- TypeScript error: `Property 'sync' does not exist on type 'ServiceWorkerRegistration'` — fixed with type cast in `lib/attendance-sync.ts`.
- PWA icons (`/icons/icon-192.png`, `/icons/icon-512.png`) referenced in manifest but not created (binary assets). Manual follow-up needed for production PWA installability.

## Ready for Next Run

Task 08 complete. 308 tests pass (22 new). Coverage 90.33% (above 80%). All subtasks done. Manual follow-up: create PNG icons in `public/icons/` for production PWA installability.
