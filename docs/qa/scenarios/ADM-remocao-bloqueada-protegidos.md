---
id: ADM-remocao-bloqueada-protegidos
area: ADM
title: Ser impedido de remover quem não pode sair
persona: Anselmo
journey: J-preparar-ano-letivo
expected: Remover o admin, editar o admin ou remover catequista com chamadas registradas falha com aviso claro e aponta a alternativa (desativar); remover ano com turmas vinculadas idem
entry_points: /admin/catequistas; /admin/anos
qa_status: pass
bug_ids: BUG-20260724-remover-ano-sem-confirmacao
fix_status: fixed
retest_status: pass
fix_commits: 99b06c3
evidence: ../evidence/2026-07-27-fixes-decisoes/S1-confirmacao-remover-ano.png; ../evidence/2026-07-27-fixes-decisoes/S1-remocao-bloqueada.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Todos devolvem 409: admin imutável/protegido (users/service.go:118,147), catequista com sessões (ErrHasSessions), ano com dependências (FK 23503). O que importa é a superfície: cada 409 vira uma frase que explica e orienta, não um erro genérico.
