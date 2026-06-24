# Task Memory: task_13.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Build the new Vite/React SPA foundation under `frontend/`: API client,
  auth context, route guards, login, forced password-change screen, and Vitest
  coverage for those new surfaces.

## Important Decisions
- Keep `frontend/` as an independent npm package because `infra/Caddy.Dockerfile`
  already builds `frontend/package.json` with `npm ci` and serves `dist`.
- Use the Go auth API contract as implemented: `/api/auth/login` returns
  `role` and `mustChangePassword`; `/api/auth/me` returns the full user profile
  with camelCase fields.
- Preserve old role routing (`admin|coordinator` -> `/admin`,
  `catechist` -> `/dashboard`) and add a client guard that forces
  `mustChangePassword` users to `/trocar-senha`.

## Learnings
- `.compozy/tasks/migration-go/_tasks.md` is currently deleted in the worktree
  before task_13 edits; avoid silently reverting until final tracking handling.
- `node_modules/next/dist/docs/` is absent in this checkout; task_13 edits do not
  touch Next runtime code.
- Final tracking restored `_tasks.md` from the HEAD shape and updated it to match
  the currently completed individual task files (04, 06-13 complete).

## Files / Surfaces
- Added `frontend/` independent Vite package with Tailwind v4/shadcn config,
  React Router app shell, API/auth clients, `AuthProvider`, route guard,
  login/password-change screens, and Vitest coverage.
- Updated task tracking in `task_13.md` and restored/updated `_tasks.md`.

## Errors / Corrections
- Initial API tests reused the same mocked `Response` twice; fixed by returning a
  fresh mocked response per request.
- Branch coverage was initially below 80%; added edge-case tests for response
  parsing and client-side form validation.

## Ready for Next Run
- Before completion/commit, rerun fresh frontend verification from lockfile:
  `npm ci`, `npm run lint`, `npm run test:coverage`, and `npm run build` in
  `frontend/`.
