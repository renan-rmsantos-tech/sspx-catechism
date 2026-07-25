# BUG-20260724-sessao-expirada-sem-caminho: Sessão expira na hora de confirmar e a tela só diz "não autenticado"

- **Status:** open
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

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
