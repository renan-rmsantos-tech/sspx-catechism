# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Migrate the login and forced password-change routes to the institutional auth shell while preserving their API and routing contracts.

## Important Decisions

- The task requires a live three-rule password checklist: minimum length, a letter plus a number, and matching confirmation. The existing auth pages contained no Zod password schema, so the schema will be introduced beside the auth UI and used as the single rule source.
- The baseline runner now captures both auth routes and stubs only `/api/auth/me` for the forced password-change route, keeping baseline capture reproducible without changing product APIs.

## Learnings

- The prerequisite foundation is already present as uncommitted workspace changes: `Field`, `Button.disabledReason`, `Brand`, DS tokens, color guard, and Playwright baseline tooling.
- The caller-named `_tasks.md`, `_tests.md`, and `_user_stories.md` files are absent; `task_01.md` records the same mismatch. Tracking cannot be updated at those exact paths unless they are supplied.
- `text-muted` resolves to the muted surface in the current Tailwind aliases, not the muted foreground ink. Auth text and the shared `Field` now use `text-muted-foreground` to retain contrast.

## Files / Surfaces

- `frontend/src/components/auth/*`, auth integration tests, and the baseline capture script/output.
- `frontend/src/components/ui/field.tsx` received the contrast correction used by both auth forms.

## Errors / Corrections

- `impeccable` detected no root `PRODUCT.md`, but the task has complete product and design context in the PRD and `design/`; creating a new product-context document is out of scope for this PRD task.
- The local Playwright revision did not have its requested Chromium binary. Captures were generated with the existing cached Chromium headless shell via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; the script already supports this fallback.

## Ready for Next Run

- Implementation and visual/test evidence are ready. Do not mark task tracking complete or create the automatic commit until the caller supplies the required master tracking file path (the specified `_tasks.md` is absent).
