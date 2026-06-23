---
status: pending
domain: API
type: Feature Implementation
scope: Full
complexity: high
dependencies:
  - task_05
  - task_06
  - task_07
---

# Task 10: API de inscrições (submit público + janela, listar, aprovar, rejeitar)

## Overview
Implementa o fluxo de inscrições: submissão pública (sem auth) validando a janela de inscrição do ano ativo, listagem para o coordenador, e a revisão (aprovar — criando/atualizando aluno; ou rejeitar com motivo). Reproduz as Server Actions de inscrição e revisão.

<requirements>
- MUST expor POST público com validação da janela do ano ativo
- MUST expor GET (coordenador) com filtro por status
- MUST aprovar: criar/atualizar aluno na turma + marcar `approved` com metadados de revisão
- MUST rejeitar: marcar `rejected` + motivo + revisor
- MUST tratar transição de estado apenas a partir de `pending`
</requirements>

## Subtasks
- [ ] 10.1 Queries sqlc (insert público, list por status, get, update aprovação/rejeição)
- [ ] 10.2 Validação da janela de inscrição (ano ativo + datas)
- [ ] 10.3 Aprovação transacional (cria/atualiza aluno + atualiza enrollment)
- [ ] 10.4 Rejeição com motivo e revisor
- [ ] 10.5 Testes incl. submissão fora da janela e dupla revisão

## Implementation Details
Ver TechSpec §API Endpoints (Inscrições) e §Data Models (campos de enrollment). O submit público é um caminho privilegiado (sem auth) — equivalente ao antigo uso do service-role client. Aprovação cria/atualiza `students` a partir dos campos da inscrição.

### Relevant Files
- `backend/db/queries/enrollments.sql` — novo
- `backend/internal/server/enrollment_handlers.go` — novo

### Dependent Files
- task_14 (revisão), task_15 (form público)

### Related ADRs
- [ADR-003](./adrs/adr-003.md)

## Deliverables
- Endpoints de inscrição completos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [ ] validação de payload e janela
- Integração:
  - [ ] submit dentro/fora da janela; aprovar cria aluno e marca approved; rejeitar registra motivo; aprovar já revisada → erro
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Fluxo de inscrição/revisão equivalente ao atual
- Submissão pública respeita a janela
