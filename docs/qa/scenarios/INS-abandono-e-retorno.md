---
id: INS-abandono-e-retorno
area: INS
title: Abandonar o formulário no meio e voltar mais tarde
persona: Marta
journey: J-inscrever-catequizando
expected: Ao voltar, a família entende onde está — dados persistidos ou recomeço claro — e nunca gera envio duplicado
entry_points: /inscricao
qa_status: pass
bug_ids: BUG-20260725-voltar-do-navegador-perde-inscricao
fix_status: fixed
retest_status: pass
fix_commits: 99b06c3
evidence: ../evidence/2026-07-27-fixes-decisoes/S3-rascunho-recuperado.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Caminho de abandono da jornada: fechar o navegador no passo 2-3, voltar horas depois; também botão voltar do navegador (não só o do stepper), refresh no passo de revisão e voltar após a tela de sucesso (reenvio?).
