---
id: CHM-dia-sem-aula
area: CHM
title: Abrir a chamada num dia que não é de aula
persona: Tereza
journey: J-fazer-chamada-offline
expected: Empty state explica que hoje não é dia de aula e não há barra de confirmação — inclusive sem rede, usando o cache local de datas
entry_points: /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids: BUG-20260725-dia-de-aula-do-ano-errado
fix_status: fixed
retest_status: pass
fix_commits: 2ca939b
evidence: ../evidence/2026-07-24-ciclo-full/S4-perseveranca-dia-sem-aula.png; ../evidence/2026-07-24-ciclo-full/S4R-dia-sem-aula-correto.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

O dashboard cacheia as datas do ano ativo (cached_class_dates no IndexedDB); a folha de chamada consulta isDateScheduledOffline quando a rede falha. Testar online e offline: a decisão "hoje tem aula?" precisa ser a mesma nos dois modos.
