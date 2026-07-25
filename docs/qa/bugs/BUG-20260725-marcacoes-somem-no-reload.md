# BUG-20260725-marcacoes-somem-no-reload: Marcações em andamento não sobrevivem a um reload — o catequista interrompido recomeça do zero

- **Status:** open
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P2
- **Persona Affected:** Joaquim
- **Journey Step:** J-fazer-chamada-offline, step 2 (marcar presenças com interrupções)
- **Scenarios:** CHM-chamada-offline-fila
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

As marcações só existem em memória até o "Confirmar chamada". Trocar de app mantém (página viva), mas qualquer reload — navegador descartando a aba por memória (rotina em celular antigo), refresh acidental, queda do navegador — zera tudo: 3 presentes viram "0 presentes, 3 sem marcar". Para o catequista interrompido a cada minuto no pátio, refazer a chamada é a diferença entre usar o app e voltar ao papel. A fila offline só protege chamadas **confirmadas**; o rascunho não tem proteção nenhuma.

## Reproduction

- **Charter:** CH-chamada-interrompida-zoom · **Tour:** Interrupt Tour
- **Environment:** phone-large 390×844, fonte 150% / pt-BR (dev local)

1. Abrir a folha e marcar alguns alunos (sem confirmar)
2. Recarregar a página (ou o navegador descartar a aba)

**Expected:** rascunho restaurado ("suas marcações de hoje foram recuperadas").
**Actual:** tudo desmarcado; recomeço do zero.

## Evidence

- Log da sessão S4: 3 presentes → reload → "0presentes / 3 sem marcar"

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
