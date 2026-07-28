# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Migrar as sete views do admin para os primitivos, fechar as três regras de fidelidade e registrar a checklist de QA.

## Important Decisions

- O `Field` local foi removido; todo campo agora usa o primitivo com um `id` estável também passado ao respectivo controle.
- `Checkbox` foi incorporado a `components/ui/choice.tsx` para preservar a proibição de controles crus, inclusive em formulários registrados pelo react-hook-form.
- Estados de inscrição são `Chip` em pt-BR; renovação usa apenas `Chip tone="gold"`.

## Learnings

- Ao tornar `controle-cru` bloqueante, a porta revelou um único input que havia sobrado em `attendance-page.tsx`; ele foi migrado para `SearchField` antes de virar a regra.

## Files / Surfaces

- `frontend/src/pages/admin/admin-page.tsx`, `admin-page.test.tsx`, `components/ui/choice.tsx`, `pages/dashboard/attendance-page.tsx`, `test/design-fidelity/rules.ts`.
- Evidência de checklist: `docs/qa/reports/2026-07-28-admin-design-system.md`.

## Errors / Corrections

- A primeira troca do `Field` deixou a implementação local sombreando o import e chamando o helper removido; o `Field` local foi eliminado e a suíte voltou a renderizar.

## Ready for Next Run

- Verificação final concluída: 98 testes verdes, cobertura global de statements 88.82%, `npm run build` e `git diff --check` verdes.
- O arquivo mestre `_tasks.md` indicado pelo prompt não existe no diretório da PRD; por isso o tracking não foi marcado como completo e o commit automático não foi criado.
