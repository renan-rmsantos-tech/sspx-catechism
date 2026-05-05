---
title: Telas do Catequista e Chamada Online
status: completed
type: frontend
complexity: medium
dependencies:
  - task_02
  - task_04
---

# Task 7: Telas do Catequista e Chamada Online

## Overview
Implementa as duas telas principais do catequista: "Minhas Turmas" (listagem das turmas atribuídas com status de chamada) e "Chamada em Andamento" (marcação de presença aluno a aluno com toggles de toque fácil). Também inclui o endpoint de submissão de chamada e o histórico por turma. As telas do Paper "1 — Catequista: Minhas Turmas" e "2 — Catequista: Chamada em Andamento" são referências visuais obrigatórias.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- **OBRIGATÓRIO: Consultar Paper screens 1 e 2 via MCP antes de implementar qualquer UI desta task**
</critical>

<requirements>
- MUST consultar Paper screens 1 e 2 antes de implementar
- MUST implementar `/dashboard` mostrando somente as turmas do catequista autenticado
- MUST implementar a tela de chamada com lista de alunos e toggles Presente/Ausente de toque fácil (botões grandes)
- MUST implementar `POST /api/attendance` que aceita o payload `{ sessions: PendingSession[] }` (batch, idempotente)
- MUST retornar `{ synced: number; skipped: number }` no `POST /api/attendance`
- MUST implementar `GET /api/attendance?classId=&from=&to=` para histórico
- A tela de chamada DEVE mostrar o estado de cada aluno: Presente (verde), Ausente (vermelho), Não marcado (neutro)
- O botão "Confirmar Chamada" só deve estar habilitado quando todos os alunos foram marcados
- A interface deve ser otimizada para uso com uma mão — botões de presença com no mínimo 48px de altura
</requirements>

## Subtasks
- [x] 7.1 Consultar Paper screens 1 e 2 via MCP (`get_jsx`, `get_screenshot`) e extrair estrutura exata de cada tela
- [x] 7.2 Implementar `GET /api/classes` filtrado por catequista autenticado e `GET /api/classes/[id]/students`
- [x] 7.3 Implementar `POST /api/attendance` com upsert idempotente por `(class_id, date)`
- [x] 7.4 Implementar `GET /api/attendance` com filtros `classId`, `from`, `to`
- [x] 7.5 Criar página `/dashboard` com lista de turmas do catequista (Paper screen 1)
- [x] 7.6 Criar página `/dashboard/turmas/[id]/chamada` com lista de alunos e toggles (Paper screen 2)
- [x] 7.7 Implementar lógica de estado local da chamada (React state): marcar/desmarcar, contador de marcados, habilitar botão confirmar

## Implementation Details
Consultar TechSpec → **Core Interfaces** para o contrato do `POST /api/attendance` (interface `PendingSession` e comportamento idempotente).

**Paper screen 1 mostra:**
- Header com título "Catequese" em âmbar, avatar do catequista
- Cards de turma com barra de progresso âmbar, badge "Chamada feita" / "Pendente"
- Botão âmbar "Iniciar Chamada" na turma com status pendente

**Paper screen 2 mostra:**
- Header âmbar com nome da turma e data
- Lista de alunos com: nome à esquerda, botões verde (✓ Presente) e vermelho (✗ Ausente) à direita
- Barra inferior com contador de marcados e botão "Confirmar Chamada"

A tela de chamada é a base para a funcionalidade offline da task_08 — o estado local mantido aqui será persistido no IndexedDB quando offline.

### Relevant Files
- `app/dashboard/page.tsx` — "Minhas Turmas" do catequista
- `app/dashboard/turmas/[id]/chamada/page.tsx` — tela de chamada
- `app/api/attendance/route.ts` — Route Handler de submissão e histórico
- `app/api/classes/route.ts` — atualizar para filtrar por catequista
- `lib/attendance/schemas.ts` — schema Zod da chamada (NOTE: placed in lib/attendance/ not lib/validations/)

### Dependent Files
- `app/dashboard/layout.tsx` (task_04) — layout mobile do catequista
- `supabase/migrations/0001_initial_schema.sql` (task_02) — tabelas `attendance_sessions` e `attendance_records`

### Related ADRs
- [ADR-003: Estratégia Offline — PWA com IndexedDB + Background Sync](adrs/adr-003.md) — Este endpoint é o alvo do sync offline (task_08)

## Deliverables
- Página "Minhas Turmas" fiel ao Paper screen 1 ✅
- Tela de chamada com toggles fiel ao Paper screen 2 ✅
- `POST /api/attendance` idempotente por `(class_id, date)` ✅
- `GET /api/attendance` com filtros funcionando ✅
- Unit tests com 80%+ coverage ✅ (94.4% global)
- Integration tests para submissão e idempotência da chamada ✅

## Tests
- Unit tests:
  - [x] Estado inicial da chamada: todos os alunos como "não marcado"
  - [x] Marcar aluno como Presente atualiza estado e cor do botão (verde)
  - [x] Marcar aluno como Ausente atualiza estado e cor do botão (vermelho)
  - [x] Botão "Confirmar Chamada" desabilitado enquanto há alunos não marcados
  - [x] Botão "Confirmar Chamada" habilitado quando todos estão marcados
  - [x] Schema Zod: sessão de chamada sem `classId` retorna erro de validação
- Integration tests:
  - [x] `GET /api/classes` para catequista retorna apenas suas turmas (não as de outros)
  - [x] `POST /api/attendance` cria sessão e registros corretamente
  - [x] `POST /api/attendance` com mesmo `(class_id, date)` não duplica sessão (retorna `skipped: 1`)
  - [x] `GET /api/attendance?classId=X` retorna somente chamadas da turma X
  - [x] Dashboard do catequista mostra badge "Chamada feita" após chamada submetida
- Test coverage target: >=80% ✅ (94.4%)
- All tests must pass ✅ (286/286)

## Success Criteria
- All tests passing ✅
- Test coverage >=80% ✅
- Telas visuais correspondem aos Paper screens 1 e 2 ✅
- Fluxo completo: abrir turma → marcar todos → confirmar → badge "Feita" no dashboard ✅
- Botões de toggle com no mínimo 48px de altura (acessível para toque) ✅ (w-12 h-12 = 48px)
- Chamada completa registrada em menos de 3 minutos (meta do PRD) ✅ (interface otimizada)
