---
id: INS-rejeitar-motivo-obrigatorio
area: INS
title: Rejeitar inscrição com motivo obrigatório
persona: Anselmo
journey: J-aprovar-inscricao
expected: O botão de rejeitar só habilita com motivo preenchido e a inscrição fica Rejeitada (terminal) com o motivo consultável no filtro de Rejeitadas
entry_points: /admin/inscricoes
qa_status: blocked-decision
bug_ids: BUG-20260725-motivo-rejeicao-invisivel
fix_status: pending
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S6-rejeitadas.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

O motivo é opcional na API mas obrigatório na UI — conferir que a UI cumpre a promessa (botão desabilitado explica) e que o motivo gravado reaparece ao consultar a inscrição rejeitada.
