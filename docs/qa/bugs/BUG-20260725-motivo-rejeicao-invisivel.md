# BUG-20260725-motivo-rejeicao-invisivel: O motivo da rejeição é obrigatório para rejeitar — e depois ninguém consegue vê-lo

- **Status:** verified
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P2
- **Persona Affected:** Anselmo
- **Journey Step:** J-aprovar-inscricao, step 4 (consultar rejeitadas)
- **Scenarios:** INS-rejeitar-motivo-obrigatorio
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

A UI exige o motivo para habilitar o "Rejeitar" (ótimo: o botão desabilitado diz "Informe o motivo"). Mas depois de rejeitada, o motivo **não aparece em lugar nenhum**: nem na tabela do filtro Rejeitadas, nem em drawer de detalhe. Quando a família ligar perguntando por quê, o coordenador não tem como consultar o que ele mesmo escreveu. Bônus de paper cut: a coluna STATUS exibe "pending"/"rejected" cru, em inglês.

## Reproduction

- **Charter:** CH-revisao-inscricoes-duas-abas · **Tour:** Multi-Tab Tour

1. Rejeitar uma inscrição com um motivo
2. Filtrar "Rejeitadas" e tentar ver o motivo (linha e clique no nome)

**Expected:** motivo visível ao consultar a rejeitada.
**Actual:** motivo gravado mas inacessível pela UI.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S6-rejeitadas.png + snapshot sem nenhuma ocorrência de "motivo" na vista de Rejeitadas

## Fix

- **Root cause:** ver Summary; decisão de 2026-07-27 registrada abaixo.
- **Fix commit:** 99b06c3 — inscrição processada abre em drawer de leitura com situação, data da revisão e motivo (ou turma, quando aprovada).
- **Regression test:** suíte do frontend/backend desta rodada (76 vitest + 185 go), com os testes novos vermelhos contra o código anterior.

## Verification

- **Retested:** 2026-07-27, sessões novas em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Rejeitada a inscrição de Sofia com motivo; ao reabrir pelo filtro "Rejeitadas", o motivo aparece por extenso e não há botões de decisão.
## Decisão

Decisão (2026-07-27, Renan): opção 2 — drawer somente-leitura para inscrições processadas, mostrando motivo/turma/status.
