---
id: INS-aprovar-renovacao-transfere
area: INS
title: Aprovar renovação vinculando aluno existente
persona: Anselmo
journey: J-aprovar-inscricao
expected: O aluno existente é atualizado e transferido para a turma escolhida, sem duplicar o cadastro
entry_points: /admin/inscricoes
qa_status: pass
bug_ids: BUG-20260725-renovacao-exige-uuid; BUG-20260727-renovacao-sobrescreve-sem-aviso
fix_status: fixed
retest_status: pass
fix_commits: 99b06c3; 740887f
evidence: ../evidence/2026-07-27-fixes-decisoes/S4-busca-aluno.png; ../evidence/2026-07-27-fixes-decisoes/S4R-confirmacao-renovacao.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Aprovação com existingStudentId sobrescreve os dados do aluno existente e o transfere de turma (renovação, flag is_renewal). Conferir que os dados antigos que a inscrição não trouxe não somem indevidamente e que o aluno some da turma antiga.
