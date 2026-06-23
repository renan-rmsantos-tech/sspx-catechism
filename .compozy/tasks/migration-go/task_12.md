---
status: pending
domain: API
type: Feature Implementation
scope: Full
complexity: medium
dependencies:
  - task_06
  - task_07
  - task_11
---

# Task 12: API de relatórios de presença (PDF/XLSX/JSON)

## Overview
Implementa o endpoint de relatórios de presença para o coordenador, com saída em JSON, PDF e XLSX. Migra a geração que era feita com `jspdf`/`xlsx` (JS) para bibliotecas Go, agregando turma + alunos + sessões + registros por período.

<requirements>
- MUST expor GET com params `classId/from/to/format`
- MUST gerar saídas `json`, `pdf` e `xlsx`
- MUST agregar sessões e registros do período por aluno
- MUST exigir papel de coordenador
</requirements>

## Subtasks
- [ ] 12.1 Queries sqlc (turma, alunos, sessões e records por período)
- [ ] 12.2 Agregação dos dados em estrutura de relatório
- [ ] 12.3 Geração JSON/PDF (gofpdf ou maroto)/XLSX (excelize)
- [ ] 12.4 Headers de content-type/disposition por formato
- [ ] 12.5 Testes de agregação e de cada formato

## Implementation Details
Ver TechSpec §API Endpoints (Relatórios) e §Key Decisions (libs Go). Validar params (datas, formato). Reusar agregação de sessões/records do domínio de presença.

### Relevant Files
- `backend/db/queries/reports.sql` — novo
- `backend/internal/server/report_handlers.go` — novo
- `backend/internal/reports/` — geração PDF/XLSX

### Dependent Files
- task_14 (botão de exportar na tela)

### Related ADRs
- [ADR-003](./adrs/adr-003.md)

## Deliverables
- Endpoint de relatórios com 3 formatos
- Unit + integração com 80%+ cobertura **(REQUIRED)**

## Tests
- Unit:
  - [ ] agregação por aluno/período correta
  - [ ] validação de params/format inválido → 400
- Integração:
  - [ ] geração JSON/PDF/XLSX retorna content-type correto e conteúdo não-vazio
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Relatórios equivalentes aos atuais nos 3 formatos
