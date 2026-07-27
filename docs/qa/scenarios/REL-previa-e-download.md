---
id: REL-previa-e-download
area: REL
title: Pré-visualizar e baixar o relatório do período
persona: Anselmo
journey: J-emitir-relatorio
expected: A prévia mostra StatCards, medidor e gráfico do período; PDF e XLSX baixam nomeados relatorio-<de>-<até> e trazem os mesmos números da prévia
entry_points: /admin/relatorios
qa_status: pass
bug_ids: BUG-20260725-previa-relatorio-tela-branca
fix_status: fixed
retest_status: pass
fix_commits: eb7b9f6
evidence: ../evidence/2026-07-24-ciclo-full/S7-previa.png; ../evidence/2026-07-24-ciclo-full/S7R-previa-ok.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

format ∈ json|pdf|xlsx; geração no Go. Conferir a tríade prévia = PDF = XLSX contra as chamadas realmente sincronizadas do período (fim verdadeiro da jornada de chamada). Números comparáveis em mono tabular na prévia (regra nº 6 do design system).
