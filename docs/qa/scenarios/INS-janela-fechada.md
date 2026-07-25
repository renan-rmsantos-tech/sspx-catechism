---
id: INS-janela-fechada
area: INS
title: Tentar inscrever com a janela de inscrições encerrada
persona: Marta
journey: J-inscrever-catequizando
expected: Aviso claro de que as inscrições estão encerradas, em linguagem de família — sem tela quebrada nem formulário que finge aceitar
entry_points: /inscricao
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S5-janela-fechada.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Backend devolve 400 quando a janela do ano ativo está fechada ou não configurada (enrollments/service.go:76-116). Verificar em que momento a família descobre: idealmente antes de preencher 4 passos, não só no envio.
