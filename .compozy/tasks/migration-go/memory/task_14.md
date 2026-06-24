# Task Memory: task_14.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Implement frontend admin area in `frontend/` for coordinator management flows:
  academic years, class dates/calendar, classes with catechists, students/search,
  catechists, enrollment review, and attendance report exports against the Go API.
- Completed implementation and verification for task_14.

## Important Decisions
- Build on the task_13 Vite SPA and add client-side admin API/helpers rather
  than using legacy Next Server Actions. Use React Hook Form in each admin form.
- Keep the first pass as a dense coordinator workspace under `/admin/*` with
  tab-like routes instead of splitting many tiny components before tests exist.
- Use Zod resolver transforms for nullable optional form fields; submit handlers
  consume resolver output directly to avoid double-parsing `null` values.

## Learnings
- Existing `frontend/` has auth shell/guards only; `/admin/*` is a placeholder.
- Backend admin API JSON is camelCase and matches TechSpec. Reports use
  `GET /api/reports/attendance?classId=&from=&to=&format=json|pdf|xlsx`.
- Caller-provided `.compozy/tasks/migration-go/_tasks.md` is deleted in the
  current worktree; HEAD still has a master task list, so final tracking may need
  special care to avoid reverting unrelated user changes.
- React Hook Form checkbox defaults must use string checkbox values (e.g. `"6"`)
  and let Zod coerce to numbers for the API payload.
- Admin sidebar links must be absolute (`/admin/anos`) because nested relative
  links from `/admin/anos` would otherwise resolve to `/admin/anos/anos`.

## Files / Surfaces
- Added `frontend/src/lib/admin-api.ts`, `frontend/src/pages/admin/admin-page.tsx`,
  `frontend/src/pages/admin/schemas.ts`, and
  `frontend/src/pages/admin/admin-page.test.tsx`.
- Updated `frontend/src/App.tsx`, `frontend/src/styles.css`,
  `frontend/package.json`, and `frontend/package-lock.json`.

## Errors / Corrections
- Initial coverage run passed tests but missed the 80% target; added admin flow
  tests for calendar, classes, students, catechists, reports, and year edit/delete.
- Self-review caught nested relative admin nav links and changed them to absolute
  admin paths.

## Ready for Next Run
- Fresh verification on 2026-06-23 passed:
  `npm run lint && npm run test:coverage && npm run build` in `frontend/`.
- Coverage evidence: all files 86.01% statements / 86.87% lines; `src/pages/admin`
  84.17% statements / 84.32% lines.
