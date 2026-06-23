---
status: completed
domain: Infrastructure
type: Configuration
scope: Full
complexity: medium
dependencies: []
---

# Task 1: Monorepo, Docker Compose, Caddy, CI e scripts de backup

## Overview
Estabelece o esqueleto de infraestrutura do monorepo: orquestração via Docker Compose (Caddy + API Go + Postgres), TLS automático, pipeline de deploy e rotina de backup off-site. É a fundação operacional sobre a qual o backend e o frontend rodam, atendendo às metas de custo previsível e deploy reproduzível do PRD.

<requirements>
- MUST orquestrar Caddy (edge/TLS), API Go e Postgres via Docker Compose
- MUST expor apenas 80/443; Postgres nunca exposto à internet
- MUST servir a SPA estática e fazer proxy de `/api/*` para a API (mesma origem)
- MUST emitir/renovar TLS automaticamente (Let's Encrypt via Caddy)
- MUST prover deploy via GitHub Actions → SSH e backup `pg_dump` cifrado → Hetzner Storage Box
</requirements>

## Subtasks
- [x] 1.1 Estruturar monorepo (`backend/`, `frontend/`, raiz com compose/Caddyfile/CI)
- [x] 1.2 Escrever `docker-compose.yml` (db, api, caddy) com healthchecks e volumes
- [x] 1.3 Configurar Caddy (TLS + SPA + proxy `/api`) e imagem que embute o build do frontend
- [x] 1.4 Criar workflow de CI/deploy (testa + `docker compose up -d` via SSH)
- [x] 1.5 Criar `scripts/backup.sh` e `scripts/restore.sh` + runbook de provisionamento

## Implementation Details
Ver TechSpec §System Architecture e §Integration Points. Caddy termina TLS e serve `/srv` (build da SPA), fazendo proxy de `/api/*` para `api:8080`. Postgres só na rede interna do Compose.

### Relevant Files
- `docker-compose.yml` — orquestração dos serviços
- `Caddyfile` — edge config (TLS, SPA, proxy)
- `infra/Caddy.Dockerfile` — build do frontend embutido no Caddy
- `.github/workflows/deploy.yml` — CI/CD
- `scripts/backup.sh`, `scripts/restore.sh` — backup/restauração
- `.env.server.example` — template de segredos do servidor
- `infra/README.md` — runbook de provisionamento Hetzner

### Dependent Files
- `backend/Dockerfile` — referenciado pelo serviço `api`
- `frontend/` (task_13) — build consumido pela `Caddy.Dockerfile`

### Related ADRs
- [ADR-001: VPS único com Docker Compose](./adrs/adr-001.md)
- [ADR-005: Compose, deploy GitHub Actions→SSH, backup Storage Box](./adrs/adr-005.md)

## Deliverables
- Stack Compose funcional (sobe com `docker compose up -d --build`)
- Caddy com TLS automático + proxy
- Pipeline de CI/CD e scripts de backup/restauração
- Runbook de provisionamento
- Validação de `docker compose config` **(REQUIRED)**

## Tests
- Unit/validação:
  - [x] `docker compose config` válida sem erros de sintaxe
  - [ ] Smoke local: `docker compose up` levanta os 3 serviços com healthcheck verde
- Integração:
  - [ ] Backup gera dump cifrado e `restore.sh` recupera num banco limpo
- Test coverage target: N/A (infra) — validação por smoke
- All checks must pass

## Success Criteria
- `docker compose config` válido
- Postgres não acessível externamente; só 80/443 abertos
- TLS emitido automaticamente em produção (verificado na task_16)
