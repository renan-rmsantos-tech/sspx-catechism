---
id: INS-sem-ano-ativo
area: INS
title: Chegar ao formulário sem ano letivo ativo configurado
persona: Marta
journey: J-inscrever-catequizando
expected: Mensagem honesta de inscrições indisponíveis, não um erro genérico nem um envio que falha em silêncio
entry_points: /inscricao
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence:
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Backend devolve 404 quando não há ano ativo (o ano é resolvido no servidor, nunca vem do cliente). Estado plausível fora de temporada ou por má configuração — a família não tem como saber; a tela precisa dizer.
