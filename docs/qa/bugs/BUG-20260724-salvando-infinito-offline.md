# BUG-20260724-salvando-infinito-offline: Confirmar a chamada sem sinal trava em "Salvando…" para sempre — a catequista nunca sabe que salvou

- **Status:** verified
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P0
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, step 3 (confirmar offline)
- **Scenarios:** CHM-chamada-offline-fila
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Sem sinal, tocar "Confirmar chamada" deixa o botão em "**Salvando…**" indefinidamente (20s+ observados, duas reproduções limpas). A mensagem prometida — "Chamada salva no aparelho. Será enviada quando a conexão retornar." — nunca aparece. A chamada **é** enfileirada (o dashboard depois mostra "1 chamada aguardando envio"), mas a catequista na frente da tela travada não tem como saber: a reação realista é tocar de novo, refazer ou desistir — no pátio, sem sinal, no fluxo que é a razão de ser do produto. Agravante descoberto na mesma sessão: com o sinal de volta, o app **não sincroniza ao carregar** — só reage ao *evento* de reconexão; quem reabre o app já online fica em "aguardando envio… será sincronizada automaticamente" até tocar o botão manual (em iOS, sem Background Sync, é o caso típico).

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network Tour
- **Environment:** phone-large 390×844 / pt-BR (dev local; navigator.onLine=false confirmado; nota de paridade: sem service worker ativo no dev — verificar em build de produção se o travamento persiste)

1. Abrir a folha de chamada online; marcar todos
2. Cortar a rede (modo avião)
3. Tocar "Confirmar chamada"

**Expected:** em ~1s, "Chamada salva no aparelho. Será enviada quando a conexão retornar." e volta ao dashboard com o chip de pendentes.
**Actual:** "Salvando…" infinito; nenhum POST tentado (correto), nenhum feedback; o item entra na fila mas a tela nunca conta.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S3-offline-saved-message.png ("Salvando…" persistente offline)
- ../evidence/2026-07-24-ciclo-full/S3-fila-aguardando.png (a fila existia; o aviso só no dashboard, depois)

## Fix

- **Root cause:** `submitAttendanceSession` aguardava `registerOneShotBackgroundSync()`, que espera `navigator.serviceWorker.ready` — promessa que nunca resolve sem service worker registrado; o item já estava na fila, mas a UI ficava presa em "Salvando…". Segundo sintoma: nada sincronizava a fila ao abrir o app já online (só o evento 'online').
- **Fix commit:** e62e6c9 (registro fire-and-forget) + f6b4c5d (sync ao abrir online; cards recarregam após sync).
- **Regression test:** attendance-sync.test.ts "resolve o envio offline mesmo se o registro…" e dashboard-page.test.tsx "sincroniza a fila pendente ao abrir o app já online" (vermelhos antes).

## Verification

- **Retested:** 2026-07-25, Tereza, sessão nova — confirmar offline mostrou "Chamada salva no aparelho…" em ~3s; ao reabrir o app online a fila drenou sozinha e o card veio "Feita hoje" sem reload. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
