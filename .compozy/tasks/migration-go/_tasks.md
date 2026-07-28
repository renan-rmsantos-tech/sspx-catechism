# Tasks — migration-go

> PRD: [`_prd.md`](_prd.md) · TechSpec: [`_techspec.md`](_techspec.md) · Histórias: [`_user_stories.md`](_user_stories.md) · Testes: [`_tests.md`](_tests.md)

**Arquivo retroativo, criado em 2026-07-28.** Agregado a partir do frontmatter dos próprios `task_NN.md` — nenhum dado foi inferido. A iniciativa rodou sem este índice, e foi a ausência dele que impediu as sessões de execução de fechar as tarefas.

| # | Arquivo | Título | Complexidade | Status |
|---|---|---|---|---|
| 1 | [task_01.md](task_01.md) | Monorepo, Docker Compose, Caddy, CI e scripts de backup | medium | completed |
| 2 | [task_02.md](task_02.md) | Fundação do backend — módulo Go, config, pgx, migrações goose + schema | high | completed |
| 3 | [task_03.md](task_03.md) | Autenticação — JWT em cookie httpOnly, bcrypt, middleware, bootstrap admin | high | completed |
| 4 | [task_04.md](task_04.md) | Authorizer — escopo por turma (substitui RLS) | high | completed |
| 5 | [task_05.md](task_05.md) | API de anos letivos (CRUD, class_days, janela de inscrição) | medium | completed |
| 6 | [task_06.md](task_06.md) | API de turmas + class_catechists (CRUD, escopo de leitura) | high | completed |
| 7 | [task_07.md](task_07.md) | API de alunos (CRUD + busca) | medium | completed |
| 8 | [task_08.md](task_08.md) | API de catequistas — completar (papel, ativar/desativar) | low | completed |
| 9 | [task_09.md](task_09.md) | API de calendário/class_dates (validação de dia, datas travadas) | medium | completed |
| 10 | [task_10.md](task_10.md) | API de inscrições (submit público + janela, listar, aprovar, rejeitar) | high | completed |
| 11 | [task_11.md](task_11.md) | API de presença — sync idempotente offline | critical | completed |
| 12 | [task_12.md](task_12.md) | API de relatórios de presença (PDF/XLSX/JSON) | medium | completed |
| 13 | [task_13.md](task_13.md) | Frontend Vite — scaffold, cliente API, auth context, guarda de rotas, login | high | completed |
| 14 | [task_14.md](task_14.md) | Frontend admin — anos, turmas, alunos, catequistas, calendário, inscrições | high | completed |
| 15 | [task_15.md](task_15.md) | Frontend dashboard + chamada offline PWA + form público de inscrição | high | completed |
| 16 | [task_16.md](task_16.md) | Deploy em produção (Hetzner) + backup automático + teste de restauração | medium | completed |

## Ressalva sobre os status

Todas as tarefas estão em `completed`. Os `memory/task_NN.md` registram, porém, que as sessões de execução não encontraram `_tasks.md`, `_user_stories.md` nem `_tests.md`, e que isso bloqueou a atualização do rastreamento mestre e o commit automático — o status foi fechado por outro caminho, não por este índice. Ver `memory/task_NN.md` para o que de fato foi entregue em cada tarefa.
