---
status: pending
domain: API
type: Feature Implementation
scope: Full
complexity: medium
dependencies:
  - task_03
---

# Task 5: API de anos letivos (CRUD, class_days, janela de inscrição)

## Overview
Implementa os endpoints de anos letivos: listagem (autenticado), criação/edição/exclusão (coordenador), incluindo `is_active`, `class_days` (dias da semana) e a janela de inscrição (`enrollment_starts_at/ends_at`). Base para turmas, calendário e inscrições.

<requirements>
- MUST expor GET (autenticado) e POST/PATCH/DELETE (coordenador)
- MUST validar `year` único (conflito 23505 → 409)
- MUST tratar exclusão com dependências (23503 → 409)
- MUST permitir ativar/desativar ano e atualizar class_days e janela
</requirements>

## Subtasks
- [ ] 5.1 Queries sqlc (list, create, update, delete)
- [ ] 5.2 Handlers + validação de payload (incl. class_days 0–6)
- [ ] 5.3 Mapear erros PG (23505/23503) para 409
- [ ] 5.4 Rotas montadas no router com gate de coordenador
- [ ] 5.5 Testes de handler e integração

## Implementation Details
Ver TechSpec §API Endpoints (Gestão acadêmica). Espelha as Server Actions de calendário/ano atuais. `class_days` é `int[]`.

### Relevant Files
- `backend/db/queries/academic_years.sql` — novo
- `backend/internal/server/academic_year_handlers.go` — novo

### Dependent Files
- task_06 (turmas), task_09 (class_dates), task_10 (inscrições)

### Related ADRs
- [ADR-003](./adrs/adr-003.md)

## Deliverables
- Endpoints de anos letivos completos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [ ] validação de class_days e janela
  - [ ] ano duplicado → 409
- Integração:
  - [ ] CRUD ponta a ponta; DELETE com turmas vinculadas → 409
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- CRUD funcional com gates corretos
- Erros de conflito mapeados para 409
