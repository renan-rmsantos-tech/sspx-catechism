---
status: completed
title: Frontend dashboard + chamada offline PWA + form público de inscrição
type: frontend
complexity: high
dependencies:
  - task_13
  - task_10
  - task_11
---

# Task 15: Frontend dashboard + chamada offline PWA + form público de inscrição

## Overview
Implementa a área do catequista (dashboard) com a chamada de presença **offline-first** (fila local em Dexie, sincronização idempotente, background sync) usando `vite-plugin-pwa`, além do formulário público de inscrição. Reproduz o comportamento PWA atual sobre o novo backend.

<requirements>
- MUST registrar PWA/service worker via vite-plugin-pwa
- MUST registrar presença offline em Dexie e sincronizar via `/api/attendance`
- MUST tratar reconexão (evento online) e background sync
- MUST implementar o formulário público de inscrição (sem auth)
- MUST não duplicar presenças ao reenviar (idempotência ponta a ponta)
</requirements>

## Subtasks
- [x] 15.1 Configurar vite-plugin-pwa (precache, runtime, sync tag)
- [x] 15.2 Portar Dexie (`pending_sessions`, `cached_class_dates`) e a fila de sync
- [x] 15.3 Tela de chamada (online → API; offline → fila) + indicadores
- [x] 15.4 Formulário público de inscrição consumindo `/api/enrollments`
- [x] 15.5 Testes Vitest da fila/sync e do formulário

## Implementation Details
Ver TechSpec §System Architecture (PWA) e §API Design (attendance). Reaproveitar `lib/db.ts`, `lib/attendance-sync.ts`, `lib/class-dates/cache.ts` e `components/dashboard/*` do app atual. A camada offline não dependia de Supabase — só muda o endpoint.

### Relevant Files
- `frontend/src/pages/dashboard/*`, `frontend/src/lib/{db,attendance-sync}.ts` — novo
- `app/dashboard/**`, `lib/db.ts`, `lib/attendance-sync.ts`, `app/inscricao/*` (Next atual) — referência

### Dependent Files
- Endpoints das tasks 10 e 11

### Related ADRs
- [ADR-002](./adrs/adr-002.md)

## Deliverables
- Dashboard com chamada offline-first funcional
- Formulário público de inscrição
- Testes Vitest com 80%+ cobertura nos módulos novos **(REQUIRED)**

## Tests
- Unit (Vitest):
  - [x] enfileira offline; flush em reconexão; sem duplicar ao reenviar
  - [x] formulário público valida e submete
- Integração:
  - [x] ciclo offline→online sincroniza e limpa a fila (fetch mockado)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Chamada offline e sincronização idempotente equivalentes ao app atual
- Inscrição pública funcional
