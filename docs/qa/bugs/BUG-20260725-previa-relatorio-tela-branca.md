# BUG-20260725-previa-relatorio-tela-branca: Pré-visualizar qualquer relatório derrubava o painel inteiro em tela branca

- **Status:** verified
- **Impact (user-side):** Blocks-Completion
- **Severity:** Critical · **Priority:** P0
- **Persona Affected:** Anselmo
- **Journey Step:** J-emitir-relatorio, step 2 (pré-visualizar)
- **Scenarios:** REL-previa-e-download
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Clicar "Pré-visualizar" com qualquer turma/período derrubava o SPA do admin em **tela branca** (crash do React em `<ReportsView>`), exigindo reload. O backend responde um shape plano (`students` + `sessions` + `records` separados); o front esperava `students[].records` aninhado e explodia em `student.records.length`. **A prévia nunca funcionou contra o backend real** — os mocks dos testes reproduziam a suposição do front, não o contrato (mesma família de BUG-20260724-editar-ano-sempre-falha e BUG-20260724-criar-turma-impossivel).

## Reproduction

- **Charter:** CH-relatorio-fim-de-periodo · **Tour:** Feature Tour
- **Environment:** desktop 1280×800 / pt-BR (dev local)

1. `/admin/relatorios` → escolher turma e período válidos → Pré-visualizar

**Expected:** StatCards, medidor e gráfico do período.
**Actual (antes do fix):** tela branca; `<main>` some do DOM; console aponta `<ReportsView>`.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S7-previa.png (tela branca)
- ../evidence/2026-07-24-ciclo-full/S7R-previa-ok.png (pós-fix, números batendo: 3 catequizandos, 6 presenças, 100%, barras 2/2/0)

## Fix

- **Root cause:** contrato divergente — front assumia records aninhado por aluno; API entrega listas planas. Mocks dos testes espelhavam o front.
- **Fix commit:** eb7b9f6 — tipo e render consomem o shape real; mock dos testes corrigido para o contrato verdadeiro (vermelho contra o código antigo).
- **Regression test:** admin-page.test.tsx "previews attendance reports…" agora alimentado com o shape real.

## Verification

- **Retested:** 2026-07-25, Anselmo — prévia renderiza com números conferidos contra as chamadas reais; PDF e XLSX válidos baixados (`relatorio-2026-07-01-2026-07-31.pdf`); turma sem registros mostra zeros sem crash. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
