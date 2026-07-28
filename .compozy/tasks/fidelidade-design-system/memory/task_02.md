# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Closed WCAG 2.4.7 focus visibility for task_02: global focus is now unlayered, field controls retain the design-specific 3px/18% ring, and the focus-removal rule blocks regressions.

## Important Decisions

- The focus rule excludes its `test/design-fidelity/` implementation from its scan so the detector and its fixtures can name the prohibited utility without self-reporting; planted fixtures remain scanned and blocking.

## Learnings

- Browser verification with deterministic API interception confirmed the 2px/2px global ring on all twelve routes; the targeted attendance and drawer controls also exposed the computed global ring.
- `npm run test:coverage` reports 88.73% statements and 89.97% lines, but 77.58% branches; Vitest does not enforce the configured branch threshold, a pre-existing TechSpec-recorded gap outside task scope.

## Files / Surfaces

- `frontend/src/styles.css`, `components/ui/{button,field}.tsx`, attendance search, fidelity gate/tests, primitive contract, and `docs/qa/reports/2026-07-27-foco-visivel.md`.

## Errors / Corrections

## Ready for Next Run

- Task complete; future primitive work must preserve the unlayered `:focus-visible` rule and avoid focus-suppression utilities.
