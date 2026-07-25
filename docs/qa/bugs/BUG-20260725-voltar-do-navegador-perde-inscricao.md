# BUG-20260725-voltar-do-navegador-perde-inscricao: O botão voltar do celular joga fora a inscrição inteira — apesar da tela prometer o contrário

- **Status:** open
- **Impact (user-side):** Data-Loss
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Marta
- **Journey Step:** J-inscrever-catequizando, steps 1-4 (wizard)
- **Scenarios:** INS-abandono-e-retorno; INS-inscricao-feliz-celular
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O wizard de 4 passos vive numa única entrada de histórico: o **voltar do navegador** (o gesto padrão do Android) não volta um passo — sai do site. Ao retornar (forward/reabrir), o formulário remonta **vazio no passo 1**: os quatro passos digitados somem. A própria tela promete "Os dados ficam guardados enquanto avança ou volta" — verdade só para os botões internos. Para a mãe de paciência curta no celular, é o fim da inscrição: ela não redigita tudo; liga para a secretaria. (Consolo verificado: reabrir dá formulário limpo, sem meio-estado nem envio duplicado.)

## Reproduction

- **Charter:** CH-inscricao-celular-primeira-vez · **Tour:** Back-Button Tour
- **Environment:** phone-small 375×812 / 4g / pt-BR (dev local)

1. Preencher os passos 1-3 e chegar à revisão
2. Apertar o voltar do navegador
3. Retornar (forward ou reabrir o link)

**Expected:** voltar = passo anterior com dados intactos (histórico por passo), ou ao menos rascunho restaurado ao retornar.
**Actual:** sai do site; retorno = passo 1 vazio; tudo perdido.

## Evidence

- Log da sessão S5: revisão preenchida (Miguel, telefone) → back → about:blank → forward → `input[name=fullName] === ""`

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
