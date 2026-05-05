# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Task 6 complete: CRUD de alunos, formulário em 3 seções fiel ao Paper screen 4, busca por nome debounced (ILIKE), edição + transferência de turma. 237 tests passing (92%+ coverage). TypeScript clean, build clean.

## Important Decisions

- **`new URL(request.url).searchParams`**: use this instead of `request.nextUrl.searchParams` — `nextUrl` is a Next.js property that doesn't exist on plain `Request` objects in Vitest tests.
- **Supabase join type cast**: `student.classes` is typed as `{ name: any }[]` even for FK-to-PK joins. Cast with `as unknown as { name: string } | null` to satisfy TypeScript.
- **`StudentSearch` debounce**: implemented with `useRef<ReturnType<typeof setTimeout>>` + `clearTimeout`. Updates the URL via `router.replace()` after 300ms. `useSearchParams()` provides current q for default input value.
- **BooleanToggle**: uses `<input type="radio">` inside a `<label>`. Test checked state with `(getAllByRole('radio') as HTMLInputElement[])[n].checked`.
- **`getByText('Turma')` fails**: "Turma" appears in both the section header `<p>` and the field `<label>`. Use `getAllByText('Turma').length >= 1` in tests.
- **`extractStudentBody` helper in actions.ts**: centralizes FormData extraction for both create and update actions, converting empty strings to `null`.

## Learnings

- `request.nextUrl` is only available on `NextRequest`. Use `new URL(request.url)` for compatibility with both `NextRequest` and plain `Request` (including test mocks).
- Supabase `select('*, classes(name)')` returns `classes` as an array-typed generic even for FK-to-PK joins. Always cast explicitly.
- jsdom component tests for Next.js Client Components that use navigation hooks need `vi.mock('next/navigation', ...)` at the top of the test file.

## Files / Surfaces

New files:
- `lib/students/schemas.ts` — Zod schemas (createStudent, updateStudent)
- `app/api/students/route.ts` — GET (with ?q search) + POST (coordinator only)
- `app/api/students/[id]/route.ts` — GET + PATCH (update / transfer)
- `app/api/classes/[id]/students/route.ts` — GET students by class
- `components/admin/student-form.tsx` — Client Component with 3 sections + Sim/Não toggles
- `components/admin/student-search.tsx` — Client Component with debounced URL update
- `app/admin/alunos/page.tsx` — list with search (Server Component reads ?q searchParams)
- `app/admin/alunos/novo/page.tsx` — create page
- `app/admin/alunos/[id]/editar/page.tsx` — edit page
- `app/admin/alunos/actions.ts` — Server Actions (createStudentAction, updateStudentAction)
- `__tests__/students.test.ts` — 33 unit + integration tests
- `__tests__/components/admin/student-form.test.tsx` — 11 component tests
- `__tests__/components/admin/student-search.test.tsx` — 4 component tests

## Errors / Corrections

- `request.nextUrl.searchParams` → replaced with `new URL(request.url).searchParams` in route handler after test failure.
- `student.classes as { name: string }` → required `as unknown as` double cast for TypeScript to accept array→object conversion.

## Ready for Next Run

Task 6 complete. 237 tests (92%+ coverage). TypeScript clean. Build clean.
→ task_07+: student endpoints and form ready. `/admin/alunos` with ILIKE search and debounced client-side search implemented.
