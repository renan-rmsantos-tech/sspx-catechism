---
status: completed
title: API de turmas + class_catechists (CRUD, escopo de leitura)
type: backend
complexity: high
dependencies:
  - task_04
  - task_05
---

# Task 6: API de turmas + class_catechists (CRUD, escopo de leitura)

## Overview
Implementa os endpoints de turmas e o vínculo com catequistas. Criação/edição por coordenador (com substituição do conjunto de catequistas), e leitura com **escopo por catequista** (catequista vê apenas suas turmas) usando o `Authorizer`. Reproduz o comportamento que era garantido por RLS.

<requirements>
- MUST expor GET (escopo por papel via Authorizer) e POST/PATCH (coordenador)
- MUST gerenciar `class_catechists` com padrão "substituir conjunto" em transação
- MUST listar alunos da turma com checagem de acesso (`CanAccessClass`)
- MUST suportar `is_archived`
</requirements>

## Subtasks
- [x] 6.1 Queries sqlc (list por papel, create, update, replace catechists, archive)
- [x] 6.2 Transação para substituir vínculos de catequistas
- [x] 6.3 Handlers + integração com `Authorizer` para escopo de leitura
- [x] 6.4 Endpoint `GET /classes/:id/students` com `CanAccessClass`
- [x] 6.5 Testes de handler/integração incl. escopo por catequista

## Implementation Details
Ver TechSpec §API Endpoints. Substituição de catequistas = delete-all + insert numa transação pgx. Leitura por catequista filtra via `class_catechists`.

### Relevant Files
- `backend/db/queries/classes.sql` — novo
- `backend/internal/server/class_handlers.go` — novo

### Dependent Files
- task_07 (alunos), task_10 (aprovação cria aluno em turma), task_11 (presença)

### Related ADRs
- [ADR-003](./adrs/adr-003.md) · [ADR-004](./adrs/adr-004.md)

## Deliverables
- Endpoints de turmas + vínculos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [x] validação de payload de turma
- Integração:
  - [x] coordenador cria/edita e substitui catequistas (transação)
  - [x] catequista lê só suas turmas; acesso a turma alheia → 403
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Escopo por catequista equivalente à RLS antiga
- Substituição de catequistas atômica
