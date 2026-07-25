# BUG-20260724-so-proxima-turma-tem-chamada: Catequista com mais de uma turma não consegue escolher qual chamada fazer — e trava de vez quando a "próxima" é impossível

- **Status:** verified
- **Impact (user-side):** Blocks-Completion
- **Severity:** Critical · **Priority:** P0
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, step 1 (dashboard → iniciar chamada)
- **Scenarios:** CHM-chamada-feliz-online; CHM-dia-sem-aula
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O dashboard só oferece **um** caminho para a chamada: o card "Próxima chamada" (e a barra fixa), que apontam para a primeira turma pendente **em ordem alfabética, sem olhar horário nem calendário**. Os cards de "Minhas turmas" são apenas informativos — tocar neles não faz nada. Consequências para Tereza (3 turmas):

1. Ela não escolhe a ordem: o app mandou fazer Crisma (11h) antes de Primeira Comunhão (9h).
2. Quando a "próxima" é a Perseverança — turma de 2027, sem alunos e sem dia de aula hoje — ela **não pode ser concluída e não sai da vez**: a chamada da Primeira Comunhão (3 alunos, dia válido) fica **inalcançável** por qualquer superfície da UI. Deadlock completo do fluxo central do produto.

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network Tour
- **Environment:** phone-large 390×844 / pt-BR (dev local)

1. Catequista vinculada a 3 turmas: Crisma (2 alunos), Primeira Comunhão (3 alunos), Perseverança (2027, 0 alunos, sem datas)
2. Fazer a chamada da Crisma (única oferecida) → "Próxima chamada" vira **Perseverança**
3. Abrir Perseverança → "Nenhum aluno nesta turma" → voltar
4. Tentar tocar no card "Primeira Comunhão" → nada acontece; não há botão, link ou menu que leve à chamada dela

**Expected:** cada turma dá acesso à própria chamada (card tocável ou botão por turma); a "próxima" considera calendário e horário e pula turmas sem aula hoje.
**Actual:** um único caminho sequencial alfabético; turma impossível trava a fila; demais turmas inacessíveis.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S3-dashboard-tereza.png (cards sem ação; próxima=Crisma)
- ../evidence/2026-07-24-ciclo-full/S3-perseveranca-sem-aula.png (a "próxima" impossível de concluir)
- Clique no texto do card "Primeira Comunhão" → URL permanece /dashboard (log da sessão)

## Fix

- **Root cause:** o único caminho para a chamada era o card "próxima" (primeira pendente em ordem alfabética, sem olhar calendário); cards eram display-only.
- **Fix commit:** f6b4c5d — cada card ganha o link "Abrir chamada". (Tornar a "próxima" ciente de calendário/horário segue como decisão de produto — ver Decisions for a Human.)
- **Regression test:** dashboard-page.test.tsx "cada card de turma dá acesso à própria chamada" (vermelho antes).

## Verification

- **Retested:** 2026-07-25, Tereza — cada card traz "Abrir chamada" navegando à folha da própria turma (deadlock desfeito). · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado; "próxima" ciente de calendário segue escalada
