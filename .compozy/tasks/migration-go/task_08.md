---
status: pending
domain: API
type: Feature Implementation
scope: Partial
complexity: low
dependencies:
  - task_03
---

# Task 8: API de catequistas — completar (papel, ativar/desativar)

## Overview
Completa a gestão de catequistas. A fundação (task_03) já implementou listar, criar (com senha gerada) e excluir (com guardas de admin e de sessões). Falta promover a coordenador e ativar/desativar, preservando as guardas de proteção do admin.

<requirements>
- MUST expor PATCH para mudar papel (promover a coordenador) e is_active
- MUST impedir desativar/rebaixar o admin protegido
- MUST reutilizar as queries `SetRole`/`SetActive` já geradas
</requirements>

## Subtasks
- [ ] 8.1 Handler PATCH `/catechists/:id` (papel e/ou is_active)
- [ ] 8.2 Guardas: bloquear alteração indevida de admin
- [ ] 8.3 Rotas com gate de coordenador
- [ ] 8.4 Testes de handler/integração

## Implementation Details
Ver TechSpec §API Endpoints (Catequistas). Queries `SetRole`/`SetActive` já existem em `users.sql`. Já implementado: `GET /catechists`, `POST /catechists`, `DELETE /catechists/:id` em `catechist_handlers.go`.

### Relevant Files
- `backend/internal/server/catechist_handlers.go` — estender
- `backend/internal/users/service.go` — métodos SetRole/SetActive

### Dependent Files
- task_14 (tela de catequistas)

### Related ADRs
- [ADR-004](./adrs/adr-004.md)

## Deliverables
- PATCH de papel/ativação completo
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [ ] bloquear mudança em admin protegido
- Integração:
  - [ ] promover a coordenador; desativar/ativar catequista
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Gestão de catequistas completa e protegida
