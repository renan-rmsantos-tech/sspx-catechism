# Tests — aplicar-design-system

> Tarefas: `task_01.md` … (5 no total) · Histórias: [`_user_stories.md`](_user_stories.md)

**Arquivo retroativo, criado em 2026-07-28**, pelo mesmo motivo descrito em [`_user_stories.md`](_user_stories.md). Não é um registro contemporâneo da execução.

Aplicação do design system Catequese à UI, em fase 0 mais quatro ondas verticais. Superseded pela iniciativa `fidelidade-design-system`, que apurou que a Onda 4 (admin) não cumpriu seu critério de saída.

## Estado dos testes

O estado de teste desta iniciativa não foi capturado enquanto ela rodava. O que existe hoje é a suíte viva do repositório, que já incorpora tudo o que sobreviveu desta e das iniciativas seguintes:

| Suíte | Comando | Estado em 2026-07-28 |
|---|---|---|
| Frontend | `npx vitest run` em `frontend/` | 104 testes, 0 falhas |
| Backend | `go test ./...` em `backend/` | 185 testes em 18 pacotes |

Números por tarefa desta iniciativa, quando registrados, estão em `memory/task_NN.md`.

## Para a próxima iniciativa

Este arquivo deve rastrear a cobertura enquanto a execução acontece — suíte, arquivos tocados por tarefa e lacunas conhecidas —, no formato de `../fidelidade-design-system/_tests.md`.
