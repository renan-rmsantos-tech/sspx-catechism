---
id: REL-periodo-invalido-claro
area: REL
title: Errar o período e ser corrigido com clareza
persona: Anselmo
journey: J-emitir-relatorio
expected: "De" depois de "Até" produz erro claro sem quebrar a tela; datas iguais valem (um dia só); turma inexistente não derruba a prévia
entry_points: /admin/relatorios
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence:
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Backend: from <= to (aceita iguais — diferente da janela de inscrição, que exige estritamente maior); formato YYYY-MM-DD obrigatório; turma inexistente → 404. Conferir que o erro chega em linguagem de coordenador, tanto na prévia quanto nos downloads.
