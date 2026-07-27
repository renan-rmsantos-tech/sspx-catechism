---
id: ADM-promovido-some-da-lista
area: ADM
title: Promover catequista a coordenador sem perdê-la de vista
persona: Anselmo
journey: J-preparar-ano-letivo
expected: Ao promover alguém a Coordenador, fica claro onde a pessoa foi parar — ela não pode simplesmente sumir da lista e das checkboxes de turma sem explicação
entry_points: /admin/catequistas; /admin/turmas
qa_status: pass
bug_ids: BUG-20260724-promovida-some-da-lista
fix_status: fixed
retest_status: pass
fix_commits: 978d0c1; 99b06c3
evidence: ../evidence/2026-07-27-fixes-decisoes/S1-pessoas-completa.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

DEFEITO SUSPEITO (inspeção de código, a confirmar): GET /api/catechists filtra role='catechist' (backend/db/queries/users.sql) — a pessoa promovida desaparece da tabela de /admin/catequistas e das checkboxes de turma, sem como rebaixá-la de volta pela UI. Os vínculos de turma existentes permanecem? Candidato a Trust-Damage.
