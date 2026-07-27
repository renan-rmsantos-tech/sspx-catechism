---
id: INS-rejeitar-motivo-obrigatorio
area: INS
title: Rejeitar inscrição com motivo obrigatório
persona: Anselmo
journey: J-aprovar-inscricao
expected: O botão de rejeitar só habilita com motivo preenchido e a inscrição fica Rejeitada (terminal) com o motivo consultável no filtro de Rejeitadas
entry_points: /admin/inscricoes
qa_status: pass
bug_ids: BUG-20260725-motivo-rejeicao-invisivel
fix_status: fixed
retest_status: pass
fix_commits: 99b06c3
evidence: ../evidence/2026-07-27-fixes-decisoes/S4-motivo-visivel.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

O motivo é opcional na API mas obrigatório na UI — conferir que a UI cumpre a promessa (botão desabilitado explica) e que o motivo gravado reaparece ao consultar a inscrição rejeitada.
