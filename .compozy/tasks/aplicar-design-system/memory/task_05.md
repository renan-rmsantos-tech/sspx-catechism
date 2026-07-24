# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Deliver the admin design-system wave: extract the seven inline admin views, then migrate the shell, data tables, enrollment review, calendar, and attendance reporting without changing backend contracts.

## Important Decisions

- The required master tracking file (`_tasks.md`) is absent from this PRD directory; task-local tracking will be updated only after verification, and the missing master file will be reported rather than invented.
- The calendar intentionally renders only class dates and today; `highlights` is an injectable future slot, per ADR-005, and no liturgical dates were introduced.

## Learnings

- The shared anchor components (`Sidebar`, `Drawer`, `Table`, `StatCard`, `Meter`, and `BarChart`) and the zero-allowlist color guard are already present from the earlier waves.
- The full suite passes when run serially (`--maxWorkers=1`); the coverage-instrumented admin run exposed an existing timing-sensitive class-creation test, so the 80% coverage gate has not been established.

## Files / Surfaces

- `frontend/src/pages/admin/admin-page.tsx` and its existing integration tests are the current monolith and behavioral baseline.
- Touched: `admin-page.tsx`, `admin-page.test.tsx`, `schemas.ts`, and `views/*.tsx` entry files.

## Errors / Corrections

- A duplicate `Administração` h1 in the new sidebar made the app-level auth test ambiguous; the sidebar label is now descriptive text and the workarea retains the page heading.

## Ready for Next Run

- Complete the physical move of view implementations out of `admin-page.tsx` (the current view entry files are compatibility re-exports), add table filters and capture the admin baseline. Do not mark task complete or commit until the coverage run is stable and the missing `_tasks.md` tracking path is resolved.
