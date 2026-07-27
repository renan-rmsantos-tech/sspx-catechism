---
id: ADM-criar-turma-vincular-catequista
area: ADM
title: Criar turma e vincular catequistas
persona: Anselmo
journey: J-preparar-ano-letivo
expected: A turma criada com catequistas marcadas aparece no dashboard de cada uma; editar o conjunto substitui os vínculos; turma arquivada some do dashboard da catequista
entry_points: /admin/turmas
qa_status: pass
bug_ids: BUG-20260724-criar-turma-impossivel; BUG-20260724-promovida-some-da-lista
fix_status: fixed
retest_status: pass
fix_commits: dd2b09a
evidence: ../evidence/2026-07-27-fixes-decisoes/S1-turma-vinculos.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

PATCH com catechistIds presente substitui o conjunto inteiro (array vazio limpa todos os vínculos — cuidado com salvar sem querer). Fim verdadeiro na outra ponta: login da catequista mostra a turma; catequista desvinculada perde acesso à chamada (403 na turma).


Ciclo 2026-07-24: criação/edição re-testadas pós-fix (dd2b09a) e visibilidade no dashboard da catequista confirmada na S3. Pernas NÃO exercitadas nesta rodada (divulgado): substituição efetiva do conjunto de vínculos e sumiço de turma arquivada do dashboard — candidatas ao próximo ciclo targeted.
