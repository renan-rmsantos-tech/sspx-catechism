---
status: completed
title: Frontend admin — anos, turmas, alunos, catequistas, calendário, inscrições
type: frontend
complexity: high
dependencies:
  - task_13
  - task_05
  - task_06
  - task_07
  - task_08
  - task_09
  - task_10
---

# Task 14: Frontend admin — anos, turmas, alunos, catequistas, calendário, inscrições

## Overview
Implementa as telas da área administrativa (coordenador) consumindo a API Go: gestão de anos letivos, turmas (com catequistas), alunos (com busca), catequistas, calendário de aulas e revisão de inscrições, além do disparo de relatórios. Reproduz as páginas e formulários do app atual.

<requirements>
- MUST cobrir CRUD de anos, turmas, alunos, catequistas e calendário
- MUST permitir aprovar/rejeitar inscrições com motivo
- MUST acionar exportação de relatórios (PDF/XLSX)
- MUST usar react-hook-form + validação espelhando os schemas atuais
</requirements>

## Subtasks
- [x] 14.1 Telas e formulários de anos letivos e calendário
- [x] 14.2 Telas de turmas (com vínculo de catequistas) e alunos (com busca)
- [x] 14.3 Tela de catequistas (criar, papel, ativar/desativar)
- [x] 14.4 Tela de revisão de inscrições (aprovar/rejeitar)
- [x] 14.5 Disparo/download de relatórios + testes Vitest

## Implementation Details
Ver TechSpec §API Endpoints. Reaproveitar formulários e componentes do app Next (`app/admin/**`, `components/admin/*`). Mutations passam a chamar a API via o cliente HTTP (task_13), não mais Server Actions.

### Relevant Files
- `frontend/src/pages/admin/*` — novo
- `app/admin/**`, `components/admin/*` (Next atual) — referência de UI

### Dependent Files
- Endpoints das tasks 05–10, 12

### Related ADRs
- [ADR-002](./adrs/adr-002.md)

## Deliverables
- Área administrativa completa em React/Vite
- Testes Vitest com 80%+ cobertura nos componentes novos **(REQUIRED)**

## Tests
- Unit (Vitest):
  - [x] formulários validam e submetem ao cliente de API
  - [x] busca de alunos; aprovar/rejeitar inscrição
- Integração:
  - [x] fluxos admin com fetch mockado retornam estados corretos
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Paridade funcional da área admin com o app atual
