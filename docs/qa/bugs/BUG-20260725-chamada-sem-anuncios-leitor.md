# BUG-20260725-chamada-sem-anuncios-leitor: Mensagens da folha de chamada não são anunciadas a leitores de tela

- **Status:** open
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P2
- **Persona Affected:** Joaquim
- **Journey Step:** J-fazer-chamada-offline, step 3 (feedback de confirmação)
- **Scenarios:** CHM-chamada-zoom-ampliado
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Na folha de chamada não há nenhuma região `aria-live`/`role=status` (varredura da passada de lentes: 0 regiões). "Chamada salva no aparelho…", erros de envio e o aviso de descarte aparecem visualmente mas não são anunciados — um catequista com leitor de tela confirma e não ouve o resultado. O dashboard já usa `role=status` no banner de fila; a folha precisa do mesmo tratamento.

## Reproduction

1. Com leitor de tela, confirmar uma chamada (online ou offline)
2. Observar que o resultado não é anunciado

**Expected:** mensagens de resultado em região `role=status`/`aria-live=polite`.
**Actual:** feedback só visual.

## Evidence

- Varredura da lens pass: `{h1:1, botoesSemNome:0, regioesLive:0}` na folha de chamada

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
