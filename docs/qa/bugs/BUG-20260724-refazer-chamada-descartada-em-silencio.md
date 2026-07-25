# BUG-20260724-refazer-chamada-descartada-em-silencio: Corrigir uma chamada já enviada finge sucesso e joga a correção fora

- **Status:** verified
- **Impact (user-side):** Data-Loss
- **Severity:** High · **Priority:** P0
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, steps 2-4 (refazer/reenviar)
- **Scenarios:** CHM-reenvio-mesma-data; CHM-sync-perda-silenciosa
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

A folha de uma chamada **já registrada** reabre em branco, como se nada tivesse sido feito — enquanto o dashboard diz "Feita hoje". A catequista remarca (corrigindo um engano), confirma, o app devolve ao dashboard **sem nenhum erro** — e o servidor descarta tudo (`ON CONFLICT DO NOTHING` → `skipped`), mantendo a versão original. Provado ao vivo: original 3/3 presentes (100%); correção com 1 ausente enviada "com sucesso"; presença acumulada permaneceu **100%** em fresh load. O mesmo tratamento cego de `{synced, skipped}` vale para a fila offline (`attendance-sync.ts` limpa a fila mesmo com synced=0): uma chamada enfileirada cuja turma foi desvinculada ou cuja data saiu do calendário também some sem aviso.

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network Tour
- **Environment:** phone-large 390×844 / pt-BR (dev local)

1. Fazer e sincronizar a chamada de uma turma (ex.: 3/3 presentes)
2. Reabrir a folha da mesma turma no mesmo dia → vem em branco, sem indicar que já existe registro
3. Marcar diferente (1 ausente) e confirmar

**Expected:** ou a folha reabre mostrando o registro existente (e edição tem regra clara), ou o envio avisa "esta chamada já estava registrada — nada foi alterado; procure a coordenação para corrigir".
**Actual:** aparência de sucesso; correção descartada; acumulado inalterado (100%).

## Evidence

- Sequência no log da sessão: POST 200 (resposta skipped), dashboard fresh load com 100% intacto
- ../evidence/2026-07-24-ciclo-full/S3-dashboard-tereza.png (estado antes)

## Fix

- **Root cause:** a resposta `{synced, skipped}` era ignorada: `submitAttendanceSession` devolvia 'synced' mesmo com tudo descartado, e o sync da fila limpava os itens sem avisar. (A reabertura da folha em branco e a política de edição de chamada seguem como decisão de produto — ver Decisions for a Human.)
- **Fix commit:** e62e6c9 (retorno 'skipped') + f6b4c5d (mensagens honestas no confirmar e no sync do dashboard).
- **Regression test:** attendance-sync.test.ts "devolve skipped…" e dashboard-page.test.tsx "avisa quando o servidor descarta…" (vermelhos antes).

## Verification

- **Retested:** 2026-07-25, Tereza — reenvio de chamada existente via fila produziu o aviso "1 chamada não foi aceita pelo servidor (já registrada ou fora do calendário)…" (evidência S3R-aviso-descartada.png). Caminho direto coberto por teste. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado; política de edição de chamada segue escalada
