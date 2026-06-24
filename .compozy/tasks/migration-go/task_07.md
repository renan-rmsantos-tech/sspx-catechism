---
status: completed
title: API de alunos (CRUD + busca)
type: backend
complexity: medium
dependencies:
  - task_06
---

# Task 7: API de alunos (CRUD + busca)

## Overview
Implementa os endpoints de alunos: listagem com busca por nome (`ILIKE`), criação, detalhe e atualização (coordenador), com o join do nome da turma. Reproduz as Server Actions de alunos e a rota de students atual.

<requirements>
- MUST expor GET (lista com busca `q`), GET/:id, POST e PATCH (coordenador)
- MUST incluir o nome da turma no retorno (join)
- MUST normalizar campos do formulário (trims, booleanos)
- MUST tratar not-found (→404) e conflitos de FK (→409)
</requirements>

## Subtasks
- [x] 7.1 Queries sqlc (search ILIKE com join classes, get, create, update)
- [x] 7.2 Handlers + validação/normalização de payload
- [x] 7.3 Mapeamento de erros (404/409)
- [x] 7.4 Rotas com gate de coordenador
- [x] 7.5 Testes de handler/integração

## Implementation Details
Ver TechSpec §API Endpoints. Busca por `full_name ILIKE '%q%'`. Campos de aluno conforme §Data Models (guardião, sacramentos, etc.).

### Relevant Files
- `backend/db/queries/students.sql` — novo
- `backend/internal/server/student_handlers.go` — novo

### Dependent Files
- task_10 (aprovação de inscrição cria/atualiza aluno), task_12 (relatórios)

### Related ADRs
- [ADR-003](./adrs/adr-003.md)

## Deliverables
- Endpoints de alunos completos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [x] normalização de payload; validação
- Integração:
  - [x] busca por nome retorna esperado; CRUD ponta a ponta; /:id inexistente → 404
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Busca e CRUD equivalentes ao comportamento atual
