---
id: ADM-data-travada-permanece
area: ADM
title: Tentar remover data que já tem chamada registrada
persona: Anselmo
journey: J-preparar-ano-letivo
expected: A data travada por chamada não sai do calendário; o erro diz qual data e por quê, e a tela mostra "Datas travadas por chamada" antes mesmo da tentativa
entry_points: /admin/calendario
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence:
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Uma data com chamada em qualquer turma fica travada (lockedDates). Como o PUT substitui o conjunto inteiro, apagar a linha da textarea equivale a remover a data → 400. Verificar que o restante da edição não se perde quando isso acontece.
