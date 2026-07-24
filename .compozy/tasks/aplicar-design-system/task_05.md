---
title: "Onda 4 — Admin: views, sidebar, tabelas, drawer, calendário, relatórios"
status: completed
type: frontend
complexity: high
dependencies:
    - task_04
---

# Task 5: Onda 4 — Admin: views, sidebar, tabelas, drawer, calendário, relatórios

## Overview

A maior onda, por último: fatia o `admin-page.tsx` monolítico (1075 linhas, 7 views inline) em arquivos por módulo e migra todo o console da coordenação — sidebar agrupada com selo de pendências, tabelas padronizadas com filtros, revisão de inscrições em drawer dedicado, calendário visual do ano e relatórios com gráficos. Fecha a iniciativa: a allowlist da guarda de cor zera e o baseline completo é capturado.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- Fatiar PRIMEIRO sem mudança de comportamento (commit separado), re-estilizar DEPOIS (TechSpec §Known Risks)
- Calendário SEM fonte de dias santos — apenas datas de aula + hoje, com slot gold pronto (ADR-005)
</critical>

<requirements>
- `admin-page.tsx` fatiado em `pages/admin/views/*.tsx` (anos, calendário, turmas, alunos, catequistas, inscrições, relatórios) como refactor puro — rotas, comportamento e testes intactos antes de qualquer re-estilização
- Shell admin com `Sidebar` agrupada (módulos por grupo, `NavLink`, colapso ≤1024px conforme `--nav-w`) e selo de pendências com a contagem de inscrições pendentes
- Tabelas padronizadas (`table` do kit, scroll horizontal próprio, números em `.num`) com filtros nos módulos de anos, turmas, alunos e catequistas; estados vazios orientando
- Revisão de inscrições: `ReviewDrawer` (composição do `drawer` do kit) com dados organizados e ações aprovar/rejeitar dali mesmo — rejeição exige motivo (schema existente `rejectEnrollmentSchema`)
- Calendário do ano substituindo a lista de datas: grade mensal com datas de aula (accent) e hoje em destaque, slot de destaque por data pronto para receber dias santos futuramente (chip `gold` sem uso por ora, ADR-005)
- Relatórios: `StatCard` + `BarChart`/`Meter` sobre `GET /api/reports/attendance` em vez de contagens em texto
- Allowlist da guarda de cor literal ZERADA — teste absoluto a partir daqui
- Fechamento: checklist `SKILL.md` em todos os módulos + baseline completo (`onda-4-admin/`) + aprovar/rejeitar de ponta a ponta pelo drawer
</requirements>

## Subtasks

- [ ] 5.1 Fatiar `admin-page.tsx` em `views/*` sem mudança de comportamento (testes existentes verdes)
- [ ] 5.2 Montar o shell admin com Sidebar agrupada e selo de pendências
- [ ] 5.3 Migrar os módulos de tabela (anos, turmas, alunos, catequistas) para o kit com filtros e estados vazios
- [ ] 5.4 Implementar o ReviewDrawer de inscrições com aprovar/rejeitar (motivo obrigatório)
- [ ] 5.5 Substituir a lista de datas pelo calendário visual (datas de aula + hoje, slot gold pronto)
- [ ] 5.6 Migrar relatórios para StatCard + barras
- [ ] 5.7 Zerar a allowlist da guarda de cor e rodar checklist + baseline finais

## Implementation Details

Ver TechSpec §System Architecture (fatiamento), §API Endpoints (todas as superfícies sobre endpoints existentes: `/api/enrollments` + approve/reject, `/api/class-dates`, `/api/reports/attendance`) e §Known Risks (refactor em duas etapas). Referências visuais: `design/ui_kits/app/shell-admin.html` (sidebar, tabelas, drawer, calendário, métricas) e `design/reference-components/Sidebar.jsx`, `ReviewDrawer.jsx`, `Metrics.jsx`. Schemas RHF dos módulos já existem em `pages/admin/schemas.ts` — inalterados.

### Relevant Files

- `frontend/src/pages/admin/admin-page.tsx` — reduzido a shell + rotas
- `frontend/src/pages/admin/views/*.tsx` — 7 views novas (extraídas e migradas)
- `frontend/src/pages/admin/schemas.ts` — consumido sem alteração
- `frontend/src/lib/admin-api.ts` — consumido sem alteração (`adminApi`, `Enrollment`, `CalendarDates`, `AttendanceReport`)
- `design/ui_kits/app/shell-admin.html` — oráculo visual
- `frontend/src/test/color-literals.test.ts` — allowlist zerada

### Dependent Files

- `frontend/src/pages/admin/admin-page.test.tsx` — verde após o fatiamento (5.1); ampliado para drawer/calendário/relatórios
- `frontend/src/App.tsx` — rota `/admin/*` inalterada
- `docs/visual-baseline/onda-4-admin/` — baseline final

### Related ADRs

- [ADR-001](adrs/adr-001.md) — Onda 4 por último, beneficiada pelas anteriores
- [ADR-003](adrs/adr-003.md) — kit via utilities + CVA
- [ADR-004](adrs/adr-004.md) — gráficos à mão
- [ADR-005](adrs/adr-005.md) — calendário só com dados existentes; validação da onda contra este ADR, não contra o HTML de referência
- [ADR-007](adrs/adr-007.md) — baseline final

## Deliverables

- Admin completo no visual novo: 7 views fatiadas, sidebar, tabelas, drawer, calendário, relatórios
- Allowlist zerada — guarda de cor literal absoluta no CI
- Baseline completo em `docs/visual-baseline/onda-4-admin/`
- Unit tests com 80%+ coverage nas views **(REQUIRED)**
- Aprovar/rejeitar pelo drawer de ponta a ponta **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Pós-fatiamento (5.1): `admin-page.test.tsx` existente verde sem modificação
  - [ ] Sidebar: grupos renderizam, selo mostra contagem de pendentes, navegação por módulo funciona
  - [ ] ReviewDrawer: abre com dados da inscrição; aprovar dispara o endpoint; rejeitar exige motivo antes de habilitar
  - [ ] Calendário: datas de aula destacadas, hoje marcado, slot de destaque aceita dados injetados (gold)
  - [ ] Relatórios: barras e stat-cards refletem os números de `AttendanceReport`
- Integration tests:
  - [ ] Fluxo de revisão de ponta a ponta: lista → abrir drawer → aprovar e rejeitar (com motivo) → lista atualizada
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing; guarda de cor literal absoluta (allowlist vazia) verde
- Todos os módulos do admin funcionando; revisão pelo drawer de ponta a ponta
- Checklist do `SKILL.md` passa em todos os módulos; baseline final capturado
- Zero vestígio da paleta âmbar ou de anti-padrões do DS em toda a aplicação
