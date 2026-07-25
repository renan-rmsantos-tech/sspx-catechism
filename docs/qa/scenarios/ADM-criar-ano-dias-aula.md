---
id: ADM-criar-ano-dias-aula
area: ADM
title: Criar ano letivo ativo com dias de aula e janela
persona: Anselmo
journey: J-preparar-ano-letivo
expected: Ano criado com dias de aula marcados e janela de inscrição válida; fim igual ou anterior ao início é recusado com erro claro; a tabela reflete o ano ativo
entry_points: /admin/anos
qa_status: pass
bug_ids: BUG-20260724-editar-ano-sempre-falha; BUG-20260724-remover-ano-sem-confirmacao
fix_status: fixed
retest_status: pass
fix_commits: dd2b09a
evidence: ../evidence/2026-07-24-ciclo-full/S1-salvar-ano-sem-feedback.png; ../evidence/2026-07-24-ciclo-full/S1-patch-400.png; ../evidence/2026-07-24-ciclo-full/S1-tabela-pos-delete.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Regras: year único e > 0; classDays 0-6 (default sábado); janela exige estritamente fim > início (datas iguais são recusadas — diferente do relatório, que aceita De = Até). PATCH distingue campo ausente de null explícito — dá para limpar a janela; conferir que a UI expõe isso sem ambiguidade.
