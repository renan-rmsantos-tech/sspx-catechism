---
id: INS-revisao-dupla-conflito
area: INS
title: Revisar a mesma inscrição em duas abas
persona: Anselmo
journey: J-aprovar-inscricao
expected: A segunda decisão recebe o aviso de que a inscrição já foi processada e a fila se atualiza — sem estado fantasma nem dupla materialização de aluno
entry_points: /admin/inscricoes
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S6-conflito-409.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Transição pending → approved|rejected é terminal; retentativa recebe 409 "já foi processada" (transação com FOR UPDATE). O que importa aqui é a superfície: o aviso é compreensível e recuperável, e nenhum aluno é criado duas vezes.
