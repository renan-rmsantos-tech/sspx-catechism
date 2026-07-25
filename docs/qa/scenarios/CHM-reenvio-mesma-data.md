---
id: CHM-reenvio-mesma-data
area: CHM
title: Reenviar a chamada da mesma turma e data sem duplicar
persona: Tereza
journey: J-fazer-chamada-offline
expected: Refazer ou reenviar a chamada da mesma turma na mesma data resulta numa única sessão (idempotente) e o app explica que aquela chamada já existe
entry_points: /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids: BUG-20260724-refazer-chamada-descartada-em-silencio
fix_status: fixed
retest_status: pass
fix_commits: e62e6c9; f6b4c5d
evidence:
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Idempotência por UNIQUE(class_id, date) com ON CONFLICT DO NOTHING → conflito vira skipped. Na fila local, remarcar a mesma turma+data faz upsert (substitui, não duplica). Verificar o que a catequista vê ao tentar refazer uma chamada já sincronizada — a segunda versão é descartada; isso precisa estar claro.
