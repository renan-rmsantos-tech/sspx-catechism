---
status: completed
title: Authorizer — escopo por turma (substitui RLS)
type: backend
complexity: high
dependencies:
  - task_03
---

# Task 4: Authorizer — escopo por turma (substitui RLS)

## Overview
Implementa a camada de autorização que antes era feita por RLS no Supabase. Centraliza as regras de "coordenador vê tudo" e "catequista só acessa suas turmas" num componente testável, usado pelas rotas de turmas, alunos e presença. É o maior risco de paridade do TechSpec e precisa de cobertura forte.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC §Core Interfaces (Authorizer) — não duplicar aqui
- TESTS REQUIRED — cobrir toda a matriz de permissões
</critical>

<requirements>
- MUST expor `IsCoordinator(claims)` e `CanAccessClass(ctx, claims, classID)`
- MUST permitir coordenador/admin em qualquer turma
- MUST permitir catequista apenas em turmas onde está em `class_catechists`
- MUST ser consumível como helper e/ou middleware parametrizado por classID
- MUST mapear negação para 403 e erro de lookup para 500
</requirements>

## Subtasks
- [x] 4.1 Definir interface `Authorizer` e implementação sobre `sqlcgen`
- [x] 4.2 Query `IsClassCatechist(class_id, catechist_id)` (sqlc)
- [x] 4.3 Helper/middleware para checar acesso à turma por path param
- [x] 4.4 Integrar nos pontos que hoje dependiam de RLS (preparado para tasks 06/07/11)
- [x] 4.5 Testes cobrindo a matriz (coordenador, admin, catequista da turma, catequista de outra)

## Implementation Details
Reproduz `private.is_coordinator()` e `private.is_class_catechist()`. Ver a matriz de políticas no TechSpec §Data Models. A checagem grossa usa `role` das claims; a fina consulta `class_catechists`.

### Relevant Files
- `backend/internal/authz/authorizer.go` — novo
- `backend/db/queries/authz.sql` — nova query `IsClassCatechist`

### Dependent Files
- `backend/internal/server/*` rotas de turmas/alunos/presença (tasks 06, 07, 11)

### Related ADRs
- [ADR-004: autorização na camada de aplicação](./adrs/adr-004.md)

## Deliverables
- `Authorizer` com `IsCoordinator` e `CanAccessClass`
- Query sqlc de verificação por turma
- Unit tests com 80%+ cobertura **(REQUIRED)**
- Integração com Postgres real para `CanAccessClass` **(REQUIRED)**

## Tests
- Unit:
  - [x] coordenador/admin → acesso a qualquer turma
  - [x] catequista da turma → acesso permitido
  - [x] catequista de outra turma → negado (403)
  - [x] erro de lookup → 500
- Integração:
  - [x] `CanAccessClass` consulta `class_catechists` corretamente
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Matriz de permissões coberta por testes verdes
- Sem regressão vs comportamento RLS documentado no TechSpec
