---
id: AUTH-usuario-inativo-bloqueado
area: AUTH
title: Ser avisada ao entrar com conta desativada
persona: Camila
journey: J-primeiro-acesso-catequista
expected: Login de conta desativada mostra aviso claro de conta inativa (não "senha errada"), com o próximo passo: procurar a coordenação
entry_points: /login
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S2-conta-inativa.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Backend distingue: credenciais inválidas → 401; usuário inativo → 403 "usuário inativo" (auth_handlers.go:37-45). Verificar que a tela traduz essa diferença em linguagem de usuária — sem "esqueci minha senha" no produto, o caminho de socorro é humano e precisa estar dito.
