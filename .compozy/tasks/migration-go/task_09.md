---
status: completed
title: API de calendário/class_dates (validação de dia, datas travadas)
type: backend
complexity: medium
dependencies:
  - task_05
---

# Task 9: API de calendário/class_dates (validação de dia, datas travadas)

## Overview
Implementa o calendário de aulas por ano letivo: listagem das datas (com as "travadas" por já terem presença) e substituição em lote das datas (coordenador), validando que cada data cai num dia de aula permitido e bloqueando a remoção de datas que já possuem chamada registrada.

<requirements>
- MUST expor GET (datas + datas travadas) e PUT (substituir datas do ano)
- MUST validar dia da semana contra `academic_years.class_days` (em Go e no trigger DB)
- MUST bloquear remoção de datas com `attendance_sessions` existentes
- MUST aplicar a substituição em transação
</requirements>

## Subtasks
- [x] 9.1 Queries sqlc (list class_dates, datas com presença, delete-all + bulk insert)
- [x] 9.2 Validação de dia da semana e cálculo de datas travadas
- [x] 9.3 PUT transacional (substituir conjunto do ano)
- [x] 9.4 Rotas com gates (GET autenticado, PUT coordenador)
- [x] 9.5 Testes incl. data inválida e remoção bloqueada

## Implementation Details
Ver TechSpec §API Endpoints. O trigger `validate_class_date_day` reforça a validação no banco (defesa em profundidade). "Datas travadas" = as que têm `attendance_sessions`.

### Relevant Files
- `backend/db/queries/class_dates.sql` — novo
- `backend/internal/server/class_dates_handlers.go` — novo

### Dependent Files
- task_11 (presença valida data agendada), task_14/15 (calendário/chamada)

### Related ADRs
- [ADR-003](./adrs/adr-003.md)

## Deliverables
- Endpoints de calendário completos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [x] validação de dia da semana
- Integração:
  - [x] PUT substitui datas; data em dia não permitido → erro; remover data com presença → bloqueado
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Calendário equivalente ao comportamento atual, com travas respeitadas
