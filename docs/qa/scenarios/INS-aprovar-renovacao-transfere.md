---
id: INS-aprovar-renovacao-transfere
area: INS
title: Aprovar renovação vinculando aluno existente
persona: Anselmo
journey: J-aprovar-inscricao
expected: O aluno existente é atualizado e transferido para a turma escolhida, sem duplicar o cadastro
entry_points: /admin/inscricoes
qa_status: blocked-decision
bug_ids: BUG-20260725-renovacao-exige-uuid
fix_status: pending
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S6-aluno-existente-nome.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Aprovação com existingStudentId sobrescreve os dados do aluno existente e o transfere de turma (renovação, flag is_renewal). Conferir que os dados antigos que a inscrição não trouxe não somem indevidamente e que o aluno some da turma antiga.
