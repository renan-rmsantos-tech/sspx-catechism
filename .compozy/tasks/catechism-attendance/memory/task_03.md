# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Implemented login flow (email+password via Supabase Auth), role-based route protection via proxy.ts, and Server Actions for login/logout. All subtasks complete.

## Important Decisions

- **proxy.ts, not middleware.ts**: Next.js 16 renamed middleware to proxy. The task spec said middleware.ts but the correct file is proxy.ts with `proxy` export. This was already documented in shared memory.
- **Role from profiles table**: Role is read from Supabase `profiles` table (DB query) on every proxy request, per task requirement. Not from user_metadata.
- **lib/auth/schemas.ts + lib/auth/routing.ts**: Extracted Zod schema and pure routing functions to `lib/` for unit testability (coverage scope is `lib/**/*.ts`).
- **getProxyUser added to lib/supabase/middleware.ts**: New export that returns both `{ response, user }` alongside the existing `updateSession` (which was kept unchanged to not break tests).
- **@hookform/resolvers installed**: Required for zod resolver in react-hook-form, was not a prior dependency.

## Learnings

- Login page is a Client Component (uses react-hook-form + useActionState + useTransition). Server Action returns `{ error }` on failure; throws `redirect()` on success.
- `redirect()` from next/navigation throws an exception in Server Actions — integration tests must use `rejects.toThrow('REDIRECT:/...')`.
- Coverage include pattern is `lib/**/*.ts` only — app/ code and proxy.ts are not counted.

## Files / Surfaces

- `lib/auth/schemas.ts` — NEW: Zod loginSchema
- `lib/auth/routing.ts` — NEW: pure routing decision functions (isPublicPath, isProtectedPath, getUnauthenticatedRedirect, getRoleRedirect)
- `lib/supabase/middleware.ts` — MODIFIED: added getProxyUser export
- `proxy.ts` — REPLACED passthrough with full auth+role logic
- `app/(auth)/login/page.tsx` — NEW: login form (Client Component)
- `app/(auth)/login/actions.ts` — NEW: loginAction + logoutAction Server Actions
- `app/admin/page.tsx` — NEW: placeholder coordinator page with logout
- `app/dashboard/page.tsx` — NEW: placeholder catechist page with logout
- `__tests__/auth.test.ts` — NEW: 35 tests (unit + integration)
- `package.json` — added @hookform/resolvers

## Errors / Corrections

None — all tests passed on first full run after coverage fix.

## Ready for Next Run

task_03 is complete. task_04 can begin.
Coverage: 98.43% stmts / 100% branches / 96.15% funcs / 98.21% lines.
104 tests total (was 68 before task_03 added 36 new tests).
