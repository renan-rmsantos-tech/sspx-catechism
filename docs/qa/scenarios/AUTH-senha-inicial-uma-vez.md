---
id: AUTH-senha-inicial-uma-vez
area: AUTH
title: Receber a senha inicial exibida uma única vez
persona: Anselmo
journey: J-primeiro-acesso-catequista
expected: O banner mostra a senha memorável deixando claro que não será exibida de novo; recarregar ou navegar não a traz de volta, e a senha repassada de fato funciona no login
entry_points: /admin/catequistas
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S1-senha-banner-tereza.png; ../evidence/2026-07-24-ciclo-full/S2-banner-sumiu-apos-reload.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

O backend gera senha memorável (ex.: graca-luz-altar-42) e a devolve em texto plano uma única vez, com must_change_password=true. E-mail duplicado é UNIQUE no banco — conferir a mensagem de conflito na criação.
