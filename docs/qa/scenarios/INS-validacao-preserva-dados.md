---
id: INS-validacao-preserva-dados
area: INS
title: Errar um campo sem perder o que já digitou
persona: Marta
journey: J-inscrever-catequizando
expected: Erro inline aponta o campo (telefone fora de (11) 99999-9999, e-mail inválido, nome curto), os demais campos ficam preservados e o passo não avança
entry_points: /inscricao
qa_status: pass
bug_ids:
fix_status:
retest_status: pass
fix_commits:
evidence:
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Validação por passo do wizard. Regras do backend: nome ≥3 chars, telefone obrigatório no formato (11) 99999-9999, e-mail obrigatório (backend/internal/enrollments/service.go). Verificar que a validação do front coincide com a do servidor e que voltar/avançar entre passos não apaga respostas.
