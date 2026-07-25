---
id: ADM-colar-datas-calendario
area: ADM
title: Colar as datas do ano vindas de planilha
persona: Anselmo
journey: J-preparar-ano-letivo
expected: Datas coladas uma por linha salvam e o grid de 12 meses reflete; datas fora dos dias permitidos são recusadas com a lista exata; duplicatas não duplicam
entry_points: /admin/calendario
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S1-colagem-suja.png; ../evidence/2026-07-24-ciclo-full/S1-erro-weekday-preserva.png; ../evidence/2026-07-24-ciclo-full/S1-calendario-salvo.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

PUT /api/class-dates substitui o conjunto inteiro, transacional; weekday validado em Go e por trigger no Postgres. Superfície ideal para colagem suja: tabs do Excel, linhas em branco, datas em formato DD/MM (a API espera ISO), espaços. O erro precisa listar as datas rejeitadas — e o que já estava salvo não pode se perder numa recusa.
