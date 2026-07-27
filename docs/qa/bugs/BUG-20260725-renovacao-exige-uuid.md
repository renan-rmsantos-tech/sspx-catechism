# BUG-20260725-renovacao-exige-uuid: Aprovar renovação pede um "aluno existente" que só aceita UUID interno

- **Status:** verified
- **Impact (user-side):** Blocks-Completion
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Anselmo
- **Journey Step:** J-aprovar-inscricao, step 3 (aprovar como renovação)
- **Scenarios:** INS-aprovar-renovacao-transfere
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O campo "Aluno existente (opcional)" do drawer de aprovação é um texto cru, sem busca, sem sugestão, sem dica de formato. O coordenador digita o nome da aluna — única coisa que ele tem — e recebe "**identificador inválido**": o campo só aceita o UUID interno do aluno, que não aparece em nenhuma tela do produto. A renovação (vincular a inscrição a um aluno já cadastrado, transferindo-o de turma) é **impossível de completar** por um humano; só funciona com acesso técnico ao banco/API. A semântica do backend está correta (verificado com UUID: transfere sem duplicar).

## Reproduction

- **Charter:** CH-revisao-inscricoes-duas-abas · **Tour:** Multi-Tab Tour
- **Environment:** desktop 1280×800 / pt-BR (dev local)

1. Abrir uma inscrição pendente de um aluno que já existe (renovação)
2. Selecionar a turma, digitar o **nome** do aluno em "Aluno existente (opcional)", Aprovar

**Expected:** busca/seleção de aluno por nome (autocomplete) e aprovação transferindo o aluno.
**Actual:** 400 "identificador inválido"; o campo exige UUID que o coordenador não possui.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S6-aluno-existente-nome.png
- Com UUID via API: aprovada; leitura independente mostra 1 única "Carla Oliveira" transferida para Crisma

## Fix

- **Root cause:** ver Summary; decisão de 2026-07-27 registrada abaixo.
- **Fix commit:** 99b06c3 — o campo vira busca por nome sobre `/api/students?q=`, com seleção explícita e opção de trocar.
- **Regression test:** suíte do frontend/backend desta rodada (76 vitest + 185 go), com os testes novos vermelhos contra o código anterior.

## Verification

- **Retested:** 2026-07-27, sessões novas em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Busca por "carla"/"bruno" devolveu o aluno com a turma; a aprovação usou o id certo sem o coordenador ver uuid nenhum.
## Decisão

Decisão (2026-07-27, Renan): opção 1 — busca de aluno por nome (autocomplete sobre /api/students?q=) no campo de aluno existente.
