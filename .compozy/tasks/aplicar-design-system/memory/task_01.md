# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Building the Phase 0 frontend foundation: translated DS theme, PWA brand assets, anchor components, color-literal guard, and baseline capture tooling.

## Important Decisions

- The existing untracked Compozy task documents are workflow inputs and will remain tracking-only unless the repository later requires them in the implementation commit.
- Legacy color literals currently exist only in `pages/dashboard/attendance-page.tsx`; it is the initial explicit allowlist entry until Wave 2 migrates that surface.
- The Phase 0 baseline script captures public login/enrollment routes at fixed mobile and desktop viewports. It supports `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only as a local fallback when the Playwright browser cache revision is unavailable.

## Learnings

- The frontend already has Base UI Dialog and CVA, while `getPendingSessionCount()` is the existing offline queue API for `NetworkChip`.
- The requested `_tasks.md`, `_tests.md`, and `_user_stories.md` files do not exist in this PRD directory; `task_01.md`, `_prd.md`, `_techspec.md`, and ADRs are present.

## Files / Surfaces

- `frontend/src/styles.css`, `frontend/src/components/ui/*`, PWA config/assets, component tests, and baseline script.
- Baseline evidence and component comparison notes are in `docs/visual-baseline/fase-0/`.

## Errors / Corrections

- The first full-suite execution had two timing failures in existing admin tests; the full retry and an isolated admin run both passed without source changes.

## Ready for Next Run

- Do not mark task tracking complete or create the automatic commit until the missing master tracking path is resolved, per `cy-execute-task` tracking requirements.
