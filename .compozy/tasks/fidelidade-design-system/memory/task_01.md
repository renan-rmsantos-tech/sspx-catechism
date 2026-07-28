# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Build the file-reading design-fidelity gate, with color literals blocking and the other four rules reporting.

## Important Decisions

- Keep the gate independent of React rendering and derive legacy classes from the reference CSS minus `src/styles.css`.
- Exclude the test tree from repository scans and `components/ui/` from the two page-surface rules; this prevents the gate from flagging its own fixtures and valid primitive internals.

## Learnings

- The calibrated report contains 31 `input` class violations in `pages/admin/admin-page.tsx`, the expected three focus suppressions, 17 variant aliases, and 39 raw controls (all direct HTML controls outside `components/ui/`).
- `docker build --target frontend -f infra/Caddy.Dockerfile .` proves the reference CSS resolves at `/design/assets/catequese-ds.css` while Vitest runs from `/app`.

## Files / Surfaces

- Added `frontend/src/test/design-fidelity/{types,scanner,legacy-classes,rules,design-fidelity.test}.ts`; removed the absorbed `color-literals.test.ts`.
- Added `scripts/pre-push.sh`; updated `infra/Caddy.Dockerfile` and `infra/README.md`.

## Errors / Corrections

- Caller-provided tracking paths `_tasks.md` and `_tests.md` are absent from the PRD directory. Do not mark the task complete until the tracking mismatch is resolved.
- An initial Docker assertion attempted to read `/infra/Caddy.Dockerfile` inside the frontend image. Removed it because the Docker build itself is the end-to-end proof; the file is intentionally not present in that image.

## Ready for Next Run

- Verification passed locally: `npm test` (91 tests), `npm run lint`, targeted gate coverage (98.59% statements, 90% branches), and the frontend Docker build (90 tests inside image plus Vite build).
- Local commit `4fd79e2` is deployed. The real `git push production main` copied the reference CSS before Vitest, passed 90 tests in the image, and logged health 200 on attempt 2 plus `deploy OK — 4fd79e2 no ar` at 2026-07-28T02:54:34Z.
- The task cannot be marked complete until the missing `_tasks.md` and `_tests.md` tracking paths are restored or the caller supplies replacement paths.
