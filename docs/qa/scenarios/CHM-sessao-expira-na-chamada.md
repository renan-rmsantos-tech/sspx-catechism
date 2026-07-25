---
id: CHM-sessao-expira-na-chamada
area: CHM
title: Perder a sessão de login no meio da chamada
persona: Tereza
journey: J-fazer-chamada-offline
expected: Se o login expira (TTL de 12h), as marcações não se perdem — a chamada permanece na fila local e o reenvio funciona após novo login
entry_points: /dashboard/turmas/:id/chamada
qa_status: blocked-decision
bug_ids: BUG-20260724-sessao-expirada-sem-caminho
fix_status: pending
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S3-401-na-confirmacao.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

JWT em cookie httpOnly com TTL de 12h. Cenário realista: chamada feita offline no sábado, celular guardado, sync tentado no domingo com token vencido → POST devolve 401. O que acontece com a fila? (Um 401 não é TypeError de rede — conferir se o erro apaga, mantém ou trava a fila, e o que a catequista vê.)
