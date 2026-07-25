---
id: REL-turma-sem-registros
area: REL
title: Consultar período sem nenhuma chamada
persona: Anselmo
journey: J-emitir-relatorio
expected: Período sem sessões mostra estado vazio honesto (zeros, aviso), não erro nem gráfico quebrado — e os downloads refletem o mesmo vazio
entry_points: /admin/relatorios
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S7-turma-vazia-ok.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Estado garantido no começo de todo ano letivo (turma nova, nenhuma chamada ainda). O medidor e o gráfico de barras precisam sobreviver a divisão por zero visual.
