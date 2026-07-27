# BUG-20260724-sessao-expirada-sem-caminho: Sessão expira na hora de confirmar e a tela só diz "não autenticado"

- **Status:** verified
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P1
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, step 3 (confirmar com token vencido)
- **Scenarios:** CHM-sessao-expira-na-chamada
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Com a folha aberta desde cedo (token de 12h vencido), "Confirmar chamada" devolve o banner cru "**não autenticado**". As marcações ficam na tela ✓ — mas não há botão de reentrar, nem redirecionamento, nem a chamada vai para a fila local; se a catequista navegar para fazer o login, perde as marcações e recomeça. O aviso não diz a única coisa que importa: "entre de novo e toque confirmar outra vez".

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network Tour
- **Environment:** phone-large 390×844 / pt-BR (dev local; expiração simulada limpando o cookie de sessão)

1. Abrir a folha, marcar presenças
2. Deixar o token expirar (12h) — simulado removendo o cookie
3. Tocar "Confirmar chamada"

**Expected:** aviso claro com caminho ("Sua sessão expirou — entre novamente; suas marcações estão guardadas") e marcações preservadas após o re-login (fila local ou estado restaurado).
**Actual:** banner "não autenticado"; marcações só sobrevivem enquanto a página viver; re-login recomeça do zero.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S3-401-na-confirmacao.png

## Fix

- **Root cause:** ver Summary; decisão de 2026-07-27 registrada abaixo.
- **Fix commit:** 99b06c3 + 740887f — o 401 enfileira a chamada, derruba a sessão local e leva ao login, que avisa que a chamada está guardada.
- **Regression test:** suíte do frontend/backend desta rodada (76 vitest + 185 go), com os testes novos vermelhos contra o código anterior.

## Verification

- **Retested:** 2026-07-27, sessões novas em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Sessão morta na hora de confirmar: a chamada foi para a fila, a catequista caiu no login com "Sua chamada está guardada no aparelho. Entre para enviá-la."; após entrar, a fila drenou sozinha (POST 200) e o servidor tem a sessão com 3 registros.
## Decisão

Decisão (2026-07-27, Renan): opção 1 — no 401 a chamada vai para a fila offline e a catequista é orientada a entrar de novo; o sync ao abrir/manual entrega depois.
