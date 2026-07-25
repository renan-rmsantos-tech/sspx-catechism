---
id: CHM-confirmar-diz-motivo
area: CHM
title: Entender por que ainda não dá para confirmar a chamada
persona: Joaquim
journey: J-fazer-chamada-offline
expected: Com alunos sem marcar, o botão desabilitado diz "Faltam N" (nunca um cinza mudo) e "Marcar todos presentes" age apenas sobre os alunos visíveis no filtro da busca
entry_points: /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S4-zoom-faltam-n.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Regra inegociável nº 4 do design system (AGENTS.md): botão desabilitado diz o motivo. Interação com a busca: filtrar por nome e usar "Marcar todos presentes" só marca os visíveis — verificar que os contadores presentes/ausentes/sem marcar e a barra de progresso contam a turma inteira, não o filtro.
