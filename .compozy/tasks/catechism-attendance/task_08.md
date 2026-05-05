---
title: Chamada Offline — PWA e Sincronização
status: completed
type: frontend
complexity: high
dependencies:
  - task_07
---

# Task 8: Chamada Offline — PWA e Sincronização

## Overview
Implementa a funcionalidade offline-first: Service Worker (Workbox via `next-pwa`) para cache de assets e interceptação de requests, Dexie.js + IndexedDB para armazenamento local de chamadas pendentes, sincronização automática via Background Sync API (com fallback `online` event para iOS/Safari) e indicador visual de status offline/pendente.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST instalar e configurar `next-pwa` com Workbox para cache de assets estáticos
- MUST criar schema Dexie.js com tabela `pending_sessions` (campos: `id`, `classId`, `date`, `catechistId`, `records[]`, `createdAt`)
- MUST implementar função `syncPendingSessions()` que lê IndexedDB, posta para `/api/attendance` e deleta registros sincronizados
- MUST registrar Background Sync tag `'sync-attendance'` para Android/Chrome
- MUST implementar fallback `window.addEventListener('online', syncPendingSessions)` para iOS/Safari
- MUST mostrar banner "Modo offline — será sincronizado em breve" quando `navigator.onLine === false`
- MUST mostrar contador de chamadas pendentes no dashboard: "N chamadas aguardando sync"
- A tela de chamada (task_07) DEVE salvar no IndexedDB quando offline em vez de postar direto para a API
- O `manifest.json` deve ser configurado para permitir instalação na tela inicial do celular
</requirements>

## Subtasks
- [x] 8.1 Instalar e configurar `next-pwa` no `next.config.ts`, gerar `manifest.json` com ícones e cores da paleta âmbar
- [x] 8.2 Criar `lib/db.ts` com schema Dexie.js para a tabela `pending_sessions`
- [x] 8.3 Implementar `lib/attendance-sync.ts` com a função `syncPendingSessions()` e registro do Background Sync
- [x] 8.4 Modificar a tela de chamada (task_07) para detectar `navigator.onLine` e redirecionar o submit para IndexedDB quando offline
- [x] 8.5 Implementar fallback `window.addEventListener('online', syncPendingSessions)` para iOS/Safari
- [x] 8.6 Criar componente `OfflineBanner` exibido quando `navigator.onLine === false`
- [x] 8.7 Criar componente `PendingSyncIndicator` no dashboard mostrando contagem de sessões pendentes no IndexedDB

## Implementation Details
Consultar TechSpec → **Core Interfaces** para a interface `PendingSession` e o código de referência de `syncPendingSessions()`.
Consultar ADR-003 para as decisões de implementação da estratégia offline.

O fluxo de submit da chamada deve ser:
1. Usuário clica "Confirmar Chamada"
2. Se `navigator.onLine === true` → posta diretamente para `POST /api/attendance`
3. Se `navigator.onLine === false` → salva no IndexedDB e exibe "Chamada salva. Será sincronizada quando a conexão retornar."
4. Ao reconectar → `syncPendingSessions()` é disparada (Background Sync ou `online` event)

### Relevant Files
- `next.config.ts` — configuração do `next-pwa`
- `public/manifest.json` — Web App Manifest
- `lib/db.ts` — schema Dexie.js
- `lib/attendance-sync.ts` — lógica de sync offline
- `app/dashboard/turmas/[id]/chamada/page.tsx` (task_07) — integrar lógica offline
- `components/offline-banner.tsx` — banner de modo offline
- `components/pending-sync-indicator.tsx` — indicador de pendências

### Dependent Files
- `app/api/attendance/route.ts` (task_07) — endpoint de sync
- `app/dashboard/page.tsx` (task_07) — integrar `PendingSyncIndicator`

### Related ADRs
- [ADR-003: Estratégia Offline — PWA com IndexedDB + Background Sync](adrs/adr-003.md) — Define a estratégia completa e o fallback para iOS

## Deliverables
- `next-pwa` configurado com cache de assets
- `manifest.json` para instalação na tela inicial
- Schema Dexie.js com `pending_sessions`
- Função `syncPendingSessions()` com Background Sync + fallback `online`
- Banner offline e indicador de sessões pendentes
- Unit tests com 80%+ coverage **(REQUIRED)**
- Integration tests para o fluxo offline → IndexedDB → sync **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `syncPendingSessions()` com IndexedDB vazio retorna sem chamar a API
  - [x] `syncPendingSessions()` com N sessões pendentes posta para `/api/attendance` e deleta as N sessões do IndexedDB
  - [x] `syncPendingSessions()` com falha na API (5xx) NÃO deleta as sessões do IndexedDB
  - [x] `OfflineBanner` renderiza quando `navigator.onLine === false`
  - [x] `OfflineBanner` não renderiza quando `navigator.onLine === true`
  - [x] `PendingSyncIndicator` mostra "2 chamadas aguardando sync" quando há 2 sessões no IndexedDB
- Integration tests:
  - [x] Fluxo completo offline: submit da chamada → salvo no IndexedDB → reconexão → sync automático (via mocks)
  - [x] Sync com mesmo `session_id` não duplica registro no servidor (existing attendance.test.ts)
  - [ ] Service Worker cacheia assets estáticos (manual: verificar no Chrome DevTools Network)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Fluxo offline completo validado: desligar Wi-Fi → fazer chamada → religar Wi-Fi → sync automático
- Nenhum registro de presença perdido durante o fluxo offline
- Fallback `online` event funciona no Safari/iOS (testar em dispositivo real)
- PWA instalável na tela inicial do celular (ícone + splash screen)
