# Master Task List — Migração para VPS/Docker com Backend em Go

Referências: [`_prd.md`](./_prd.md) · [`_techspec.md`](./_techspec.md) · [ADRs](./adrs/)

Status: `completed` = implementado e verificado · `pending` = não iniciado.

| # | Task | Domínio | Complexidade | Dependências | Status |
|---|---|---|---|---|---|
| [01](./task_01.md) | Monorepo, Docker Compose, Caddy, CI e scripts de backup | Infrastructure | medium | — | completed |
| [02](./task_02.md) | Fundação do backend: módulo Go, config, pgx, migrações goose + schema | Database | high | task_01 | completed |
| [03](./task_03.md) | Autenticação: JWT em cookie httpOnly, bcrypt, middleware, bootstrap admin | Authentication | high | task_02 | completed |
| [04](./task_04.md) | Authorizer: escopo por turma (substitui RLS) | Authorization | high | task_03 | pending |
| [05](./task_05.md) | API de anos letivos (CRUD, class_days, janela de inscrição) | API | medium | task_03 | pending |
| [06](./task_06.md) | API de turmas + class_catechists (CRUD, escopo de leitura) | API | high | task_04, task_05 | pending |
| [07](./task_07.md) | API de alunos (CRUD + busca) | API | medium | task_06 | pending |
| [08](./task_08.md) | API de catequistas — completar (papel, ativar/desativar) | API | low | task_03 | pending |
| [09](./task_09.md) | API de calendário/class_dates (validação de dia, datas travadas) | API | medium | task_05 | pending |
| [10](./task_10.md) | API de inscrições (submit público + janela, listar, aprovar, rejeitar) | API | high | task_05, task_06, task_07 | pending |
| [11](./task_11.md) | API de presença — sync idempotente offline | API | critical | task_06, task_09 | pending |
| [12](./task_12.md) | API de relatórios de presença (PDF/XLSX/JSON) | API | medium | task_06, task_07, task_11 | pending |
| [13](./task_13.md) | Frontend Vite: scaffold, cliente API, auth context, guarda de rotas, login | Frontend | high | task_03 | pending |
| [14](./task_14.md) | Frontend admin: anos, turmas, alunos, catequistas, calendário, inscrições | Frontend | high | task_13, task_05, task_06, task_07, task_08, task_09, task_10 | pending |
| [15](./task_15.md) | Frontend dashboard + chamada offline PWA + form público de inscrição | Frontend | high | task_13, task_10, task_11 | pending |
| [16](./task_16.md) | Deploy em produção (Hetzner) + backup automático + teste de restauração | Infrastructure | medium | task_14, task_15 | pending |

## Sequência de build recomendada
1. **Fundação (✅ feita):** 01 → 02 → 03
2. **Autorização + recursos backend:** 04 → 05 → (06 → 07) · 08 · 09 → 10 → 11 → 12
3. **Frontend:** 13 → 14 · 15
4. **Finalização:** 16

## Fases do PRD
- **Fase 1 (Fundação/Auth):** 01–04, 08, 13
- **Fase 2 (Gestão/Inscrição):** 05–07, 09, 10, 12, 14
- **Fase 3 (Chamada offline/Finalização):** 11, 15, 16
