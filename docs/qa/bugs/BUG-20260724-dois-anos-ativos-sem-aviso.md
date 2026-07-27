# BUG-20260724-dois-anos-ativos-sem-aviso: Sistema aceita dois anos letivos ativos e escolhe um em silêncio

- **Status:** verified
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Anselmo
- **Journey Step:** J-preparar-ano-letivo, step 1 (ano ativo)
- **Scenarios:** ADM-dois-anos-ativos
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Na virada de ano (cenário real: 2026 ainda ativo, o coordenador cria 2027/2028 já ativo), o sistema aceita **dois anos "Ativo" ao mesmo tempo** sem nenhum aviso, e todo o produto passa a depender de qual linha o banco devolve primeiro: a inscrição pública, a fila de revisão e o badge de pendentes resolvem "o ano ativo" com `LIMIT 1` sem ordenação declarada. No teste, uma inscrição pública enviada com 2026 e 2028 ativos foi aceita (caiu no escopo de um deles, sem indicação de qual). Nada quebra na cara do coordenador — o que é exatamente o problema: as inscrições podem estar caindo no ano errado e ninguém percebe.

## Reproduction

- **Charter:** CH-preparar-ano-colando-datas · **Tour:** Paste Tour
- **Environment:** desktop 1280×800 / wifi / pt-BR (dev local)

1. Em `/admin/anos`, com 2026 ativo (janela aberta), criar ano 2028 marcando "Ano ativo"
2. Observar a tabela: 2026 **Ativo** e 2028 **Ativo**, sem aviso, sem conflito
3. Em aba anônima, enviar uma inscrição em `/inscricao` → aceita (qual ano recebeu? não há como saber pela UI)

**Expected:** ou o sistema impede o segundo ano ativo ("Desative 2026 antes de ativar 2028"), ou torna explícito qual ano rege inscrições/calendário.
**Actual:** ambos ficam Ativo; a resolução é silenciosa e sem ordem garantida.

Agravante: com [[BUG-20260724-editar-ano-sempre-falha]], desativar um dos anos pela edição é impossível — a única saída da ambiguidade é excluir um ano.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S1-dois-anos-ativos.png (dois "Ativo" na tabela)
- ../evidence/2026-07-24-ciclo-full/S1-inscricao-com-2-anos-ativos.png (formulário público aceitando)

## Fix

- **Root cause:** ver Summary; decisão de 2026-07-27 registrada abaixo.
- **Fix commit:** 978d0c1 — ativar um ano desativa o anterior (troca atômica no serviço) e o índice parcial `academic_years_single_active` garante a unicidade no banco; a migração normaliza bases com mais de um ativo.
- **Regression test:** suíte do frontend/backend desta rodada (76 vitest + 185 go), com os testes novos vermelhos contra o código anterior.

## Verification

- **Retested:** 2026-07-27, sessões novas em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Ativação por criação e por edição testadas em persona: a tabela passou a mostrar exatamente um "Ativo" nos dois caminhos, confirmado em fresh load.
## Decisão

Decisão (2026-07-27, Renan): opção 1 — troca atômica: ativar um ano desativa o anterior; unicidade garantida por índice parcial no banco.
