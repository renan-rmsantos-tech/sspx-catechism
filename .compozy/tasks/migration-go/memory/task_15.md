# Task Memory: task_15.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Implement task_15 in the Vite SPA: PWA registration, Dexie-backed offline
  attendance queue, catechist dashboard/chamada, and public enrollment form.
- Pre-existing workspace state includes many modified task files and a deleted
  `.compozy/tasks/migration-go/_tasks.md`; do not revert those unrelated changes.
- Implementation completed locally for the frontend surfaces; verification has
  passed with frontend typecheck, tests, coverage, and production build.

## Important Decisions
- Target implementation is `frontend/` (Vite/React). The old Next app is used
  only as a reference because `node_modules/next/dist/docs/` is absent in this
  checkout and the task does not require editing Next code.
- Dashboard data will be assembled from existing Go API endpoints:
  `/api/classes`, `/api/classes/:id/students`, `/api/class-dates`, and
  `/api/attendance`; no backend changes planned unless a contract gap appears.
- Dexie queue deduplicates pending sessions by `(classId,date)` before replay;
  backend idempotency still remains authoritative for resent batches.
- Vitest runs with `fileParallelism: false` and `maxWorkers: 1` because the
  existing frontend tests rely on process-global `fetch`/`URL` stubs.

## Learnings
- `frontend/` currently has auth/admin only; `/dashboard/*` is a placeholder.
- `frontend/package.json` lacks `dexie` and `vite-plugin-pwa`; old offline code
  exists in root `lib/db.ts`, `lib/attendance-sync.ts`, and class-date cache.
- `vite-plugin-pwa` injectManifest build succeeds and emits
  `dist/service-worker.js`; the service worker handles the `sync-attendance`
  tag and calls the shared Dexie sync function.
- Coverage evidence: `npm run test:coverage --prefix frontend` passed with
  84.84% statements / 86.62% lines overall; dashboard pages were 86.2% lines
  and enrollment page 93.54% lines.

## Files / Surfaces
- Touched frontend surfaces: `frontend/vite.config.ts`,
  `frontend/vitest.config.ts`, `frontend/src/main.tsx`, `frontend/src/App.tsx`,
  `frontend/src/service-worker.ts`, `frontend/public/pwa.svg`,
  `frontend/src/lib/{db,attendance-sync,attendance-types,class-dates-cache,dashboard-api,enrollment-api}.ts`,
  `frontend/src/pages/dashboard/*`, `frontend/src/pages/enrollment/*`,
  frontend tests, and package metadata.

## Errors / Corrections
- `node_modules/next/dist/docs/` is absent; no Next code was edited.
- Initial Vitest full-suite failures were caused by cross-file global mock races;
  single-worker/serialized test config fixed the suite.
- `_tasks.md` remains unavailable as a deleted pre-existing worktree change, so
  master tracking could not be updated in this run.

## Ready for Next Run
- Remaining workflow action: if `_tasks.md` is restored/provided, update the
  master task entry for task_15 to completed.
