---
status: pending
domain: API
type: Feature Implementation
scope: Full
complexity: critical
dependencies:
  - task_06
  - task_09
---

# Task 11: API de presença — sync idempotente offline

## Overview
Implementa o endpoint mais crítico do sistema: a sincronização idempotente de chamadas feitas offline. Reenviar o mesmo lote não pode duplicar sessões nem registros. É o ponto de maior risco do TechSpec e exige cobertura de testes robusta.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC §API Design (attendance) e §Known Risks
- TESTS REQUIRED — reenvio do mesmo lote NÃO pode duplicar
</critical>

<requirements>
- MUST aceitar lote `{sessions:[...]}` e retornar `{synced, skipped}`
- MUST usar `catechist_id` do token (NUNCA o enviado pelo cliente)
- MUST pular datas não agendadas (skipped)
- MUST `INSERT ON CONFLICT (class_id,date) DO NOTHING` para a sessão
- MUST inserir records com `ON CONFLICT (session_id,student_id) DO NOTHING`
- MUST preservar a leniência de UUID (não-RFC4122)
- MUST expor GET com filtros classId/from/to (com records embutidos)
</requirements>

## Subtasks
- [ ] 11.1 Queries sqlc (upsert session retornando id+created, upsert records, is_scheduled, get com join)
- [ ] 11.2 Handler POST: loop por sessão (valida data agendada → dedup → insert → records)
- [ ] 11.3 Handler GET com filtros e join de records
- [ ] 11.4 Validação de payload preservando UUID leniente
- [ ] 11.5 Testes de idempotência e de borda

## Implementation Details
Ver TechSpec §Core Interfaces (AttendanceRepo) e §API Design. Acesso à turma via `Authorizer` (task_04). A idempotência depende dos índices únicos `(class_id,date)` e `(session_id,student_id)`.

### Relevant Files
- `backend/db/queries/attendance.sql` — novo
- `backend/internal/server/attendance_handlers.go` — novo
- `backend/internal/attendance/` — lógica de sync (opcional)

### Dependent Files
- task_12 (relatórios), task_15 (chamada offline no frontend)

### Related ADRs
- [ADR-003](./adrs/adr-003.md) · [ADR-004](./adrs/adr-004.md)

## Deliverables
- Endpoints de presença (POST sync + GET)
- Unit + integração com 80%+ cobertura **(REQUIRED)**
- Teste explícito de reenvio idempotente **(REQUIRED)**

## Tests
- Unit:
  - [ ] payload com UUID leniente aceito; data inválida marcada skipped
- Integração:
  - [ ] reenviar o mesmo lote 2x → sem duplicação (synced então skipped)
  - [ ] `catechist_id` persiste do token, não do cliente
  - [ ] data não agendada → skipped
  - [ ] records duplicados não inserem
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Idempotência comprovada por teste de reenvio
- Comportamento equivalente ao endpoint atual
