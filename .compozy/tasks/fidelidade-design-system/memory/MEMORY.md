# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

## Shared Decisions

- Global `:focus-visible` intentionally remains outside every CSS layer: unlayered CSS outranks Tailwind utilities and makes the keyboard ring non-suppressible. Field controls add the design-specific 3px accent-at-18% shadow on top.
- `Table` owns comparable-number presentation through its optional `numericColumns` API: declared cells receive mono tabular, right alignment and nowrap. `SearchField` is available from `components/ui/field` for future raw search-input migrations.

## Shared Learnings

- The `foco-apagado` gate is blocking from task_02 onward and scans application source while excluding its own detector implementation; its planted fixture still proves enforcement.

## Open Risks

## Handoffs
