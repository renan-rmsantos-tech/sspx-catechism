---
id: CHM-chamada-feliz-online
area: CHM
title: Fazer a chamada de sábado com rede boa
persona: Tereza
journey: J-fazer-chamada-offline
expected: Chamada confirmada e sincronizada na hora, a data fica travada no calendário e a sessão aparece no histórico e no relatório do período
entry_points: /dashboard; /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids: BUG-20260724-chamada-data-utc-errada; BUG-20260724-so-proxima-turma-tem-chamada; BUG-20260724-saudacao-fuso-errado
fix_status: fixed
retest_status: pass
fix_commits: f6b4c5d
evidence: ../evidence/2026-07-24-ciclo-full/S3-chamada-data-utc.png; ../evidence/2026-07-24-ciclo-full/S3-dashboard-tereza.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Caminho feliz online: dashboard → iniciar chamada → marcar (busca, Marcar todos presentes, contadores) → confirmar → synced. Fim verdadeiro nas outras pontas: data travada em /admin/calendario e sessão no relatório do coordenador.
