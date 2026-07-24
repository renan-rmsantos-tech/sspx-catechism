---
title: "Onda 2 — Catequista: dashboard e folha de chamada"
status: completed
type: frontend
complexity: high
dependencies:
    - task_02
---

# Task 3: Onda 2 — Catequista: dashboard e folha de chamada

## Overview

Migra o coração do produto para o visual novo: dashboard do catequista (cartões de turma, medidores de presença, chip de rede permanente) e folha de chamada (linhas de toque generosas, busca, marcar-todos, trilho de progresso, botão "Faltam N", fila de sincronização visível). Remove o verde/vermelho inline que motivou o redesign — e a capacidade offline existente precisa permanecer intacta.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- NÃO tocar `lib/db.ts`, `lib/attendance-sync.ts`, `service-worker.ts` — o offline é consumido, nunca alterado (TechSpec §Impact Analysis)
</critical>

<requirements>
- `dashboard-page.tsx` migrado: cartões de turma (`card`), medidores (`Meter`), `NetworkChip` permanente com contagem de pendências e ação de sincronizar, estados vazios orientando o próximo passo (`EmptyState`)
- `attendance-page.tsx` migrado: `AttendanceRow` (alvo ≥44px, presença/ausência só com tokens — os hex `#dcfce7`/`#16a34a`/`#fee2e2`/`#dc2626` etc. saem), busca de aluno, marcar-todos (`seg`), trilho de progresso, contagens honestas em `.num`
- Botão de confirmação com `disabledReason` dinâmico ("Faltam 4") até todos os alunos marcados
- Aviso visível de chamadas aguardando sincronização (fila com contagem e ação)
- Fluxo offline preservado de ponta a ponta: marcar sem rede → fila visível → sincronização ao voltar (Dexie + Background Sync inalterados)
- Arquivos desta onda saem da allowlist da guarda de cor literal
- Fechamento: checklist `SKILL.md` + baseline (`onda-2-catequista/`, incluindo captura com offline simulado) + teste manual offline
</requirements>

## Subtasks

- [ ] 3.1 Migrar o dashboard: cartões, medidores, saudação, NetworkChip permanente
- [ ] 3.2 Migrar a folha de chamada para `AttendanceRow` + busca + marcar-todos + trilho de progresso
- [ ] 3.3 Implementar o botão de confirmação com "Faltam N" e contagens honestas em mono tabular
- [ ] 3.4 Tornar a fila de sincronização visível com ação de sincronizar
- [ ] 3.5 Remover os hex inline da chamada e encolher a allowlist da guarda
- [ ] 3.6 Validar o fluxo offline manualmente e rodar checklist + baseline da onda

## Implementation Details

Ver TechSpec §Core Interfaces (`AttendanceRowProps`, `NetworkChip`) e §Impact Analysis (risco alto — coração offline). Referências visuais: `design/ui_kits/app/shell-catechist.html` e `attendance-sheet.html`; comportamento em `design/reference-components/AttendanceRow.jsx`. As funções de sync (`getPendingSessionCount`, `syncPendingSessions`, `registerAttendanceSyncHandlers`) já são consumidas pelo dashboard atual — a UI nova reusa exatamente as mesmas.

### Relevant Files

- `frontend/src/pages/dashboard/dashboard-page.tsx` — migrado ao kit
- `frontend/src/pages/dashboard/attendance-page.tsx` — migrado; hex inline removidos (linhas 183–198 atuais)
- `design/ui_kits/app/attendance-sheet.html`, `shell-catechist.html` — oráculos visuais
- `frontend/src/test/color-literals.test.ts` — allowlist encolhe

### Dependent Files

- `frontend/src/lib/attendance-sync.ts`, `lib/db.ts`, `src/service-worker.ts` — consumidos sem alteração; suíte de sync é a prova de paridade
- `frontend/src/lib/dashboard-api.ts`, `lib/class-dates-cache.ts` — consumidos sem alteração
- `frontend/src/pages/dashboard/dashboard-page.test.tsx` — deve permanecer verde (ajustes só de seletores visuais se inevitável)

### Related ADRs

- [ADR-001](adrs/adr-001.md) — Onda 2 com fundação já validada
- [ADR-003](adrs/adr-003.md) — estilização via utilities + CVA

## Deliverables

- Dashboard e chamada completos no visual novo, offline intacto
- Zero hex inline nos arquivos da onda; allowlist reduzida
- Baseline da onda (incluindo estado offline) em `docs/visual-baseline/onda-2-catequista/`
- Unit tests com 80%+ coverage nas telas alteradas **(REQUIRED)**
- Suíte de `attendance-sync` verde sem modificação **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Chamada: marcar presente/ausente atualiza contagens; "Faltam N" decresce e o botão habilita apenas com todos marcados
  - [ ] Busca filtra alunos; marcar-todos aplica a todos os visíveis
  - [ ] NetworkChip: offline exibe estado e contagem de pendências; ação de sincronizar chama `syncPendingSessions`
  - [ ] Dashboard: estado vazio orienta próximo passo; medidores refletem os dados
- Integration tests:
  - [ ] Fluxo offline: submeter chamada sem rede enfileira no Dexie (fake-indexeddb), fila visível, sync posterior esvazia — reusando os padrões de `App.test`/`attendance-sync.test`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing; suíte existente (sync, dashboard, api) verde
- Chamada online e offline funcionando como antes (teste manual registrado)
- Checklist do `SKILL.md` passa nas duas telas; baseline capturado
- Guarda de cor literal passa com allowlist reduzida (sem os arquivos desta onda)
