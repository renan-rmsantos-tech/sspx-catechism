# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Migrar a inscrição pública para um único form RHF em quatro etapas, preservando o contrato de `POST /api/enrollments`.

## Important Decisions

- O estado da etapa fica somente na página; `Stepper` continua apresentacional. Cada avanço valida um `publicEnrollmentSchema.pick(...)` e a submissão final usa o resolver do schema completo.
- O baseline de Onda 3 seleciona só a rota pública `/inscricao` no script de captura, produzindo os viewports mobile e desktop para essa superfície.

## Learnings

- O schema Zod transforma campos textuais vazios em `null`; RHF usa uma forma de entrada só com strings e o `zodResolver` entrega o payload transformado à submissão. O teste de paridade cobre esse formato.
- A cobertura direcionada da página foi 93.93% statements, 85.71% branches, 80% functions e 93.33% lines.

## Files / Surfaces

- `frontend/src/pages/enrollment/enrollment-page.tsx`
- `frontend/src/pages/enrollment/enrollment-page.test.tsx`
- `frontend/scripts/capture-baseline.ts`
- `docs/visual-baseline/onda-3-inscricao/`

## Errors / Corrections

- Os arquivos de contrato solicitados `_tasks.md`, `_user_stories.md` e `_tests.md` seguem ausentes, como já registrado pelas tarefas anteriores; isso bloqueia apenas a atualização do master tracking e o commit automático.
- `npm test` completo falha em dois testes preexistentes de `admin-page.test.tsx` (criação de turma e relatório), sem relação com os arquivos desta tarefa. A suíte específica de inscrição passou.

## Ready for Next Run

- Implementação e baseline estão prontos para a verificação final; ainda é preciso rodar os gates finais, auto-revisar e atualizar o task file se o tracking master for disponibilizado.
