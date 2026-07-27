---
id: INS-aprovar-cria-aluno
area: INS
title: Aprovar inscrição criando aluno novo na turma
persona: Anselmo
journey: J-aprovar-inscricao
expected: Aluno aparece na turma escolhida, o badge de pendentes decrementa e a folha de chamada do catequista passa a listá-lo
entry_points: /admin/inscricoes
qa_status: pass
bug_ids:
fix_status:
retest_status: pass
fix_commits:
evidence:
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Aprovação sem existingStudentId cria aluno novo (transação com SELECT ... FOR UPDATE). Fim verdadeiro em duas pontas: busca de /admin/alunos e chamada do catequista da turma.
