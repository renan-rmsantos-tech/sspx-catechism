---
status: completed
title: Deploy em produção (Hetzner) + backup automático + teste de restauração
type: infra
complexity: medium
dependencies:
    - task_14
    - task_15
---

# Task 16: Deploy em produção (Hetzner) + backup automático + teste de restauração

## Overview
Coloca a aplicação completa em produção no VPS Hetzner seguindo o runbook, ativa o backup noturno automático para o Hetzner Storage Box e **comprova a restauração** — critério de sucesso final do PRD. Encerra a migração com o desligamento de Vercel/Supabase.

<requirements>
- MUST provisionar VPS, DNS e segredos conforme runbook
- MUST subir a stack via Docker Compose com TLS automático
- MUST agendar `backup.sh` (cron) e validar a restauração
- MUST validar paridade funcional dos 3 perfis
- MUST desligar Vercel/Supabase ao final
</requirements>

## Subtasks
- [ ] 16.1 Provisionar servidor, firewall, Docker e DNS (runbook)
- [ ] 16.2 Configurar `.env` de produção e primeiro deploy
- [ ] 16.3 Configurar CI (secrets SSH) para deploy automático
- [ ] 16.4 Agendar backup noturno e executar teste de restauração
- [ ] 16.5 Checklist de paridade (3 perfis) e desligamento de Vercel/Supabase

## Implementation Details
Ver TechSpec §Development Sequencing (runbook) e `infra/README.md`. Verificar healthcheck, emissão de TLS, bootstrap do admin e sincronização offline em produção.

### Relevant Files
- `infra/README.md`, `docker-compose.yml`, `Caddyfile`, `scripts/backup.sh`, `scripts/restore.sh`, `.github/workflows/deploy.yml`

### Dependent Files
- Todo o backend e frontend (entregue por todas as tasks anteriores)

### Related ADRs
- [ADR-001](./adrs/adr-001.md) · [ADR-005](./adrs/adr-005.md)

## Deliverables
- Aplicação no ar em `https://` com TLS válido
- Backup automático ativo + restauração comprovada
- Checklist de paridade preenchido
- Verificação de custo ≤ $15/mês **(REQUIRED)**

## Tests
- Validação/integração:
  - [ ] Deploy do zero sobe a stack com healthchecks verdes
  - [ ] `backup.sh` gera dump cifrado off-site; `restore.sh` recupera com sucesso
  - [ ] Login dos 3 perfis e chamada offline funcionam em produção
  - [ ] Nenhuma chamada de runtime a Vercel/Supabase
- Test coverage target: N/A (operacional)
- All checks must pass

## Success Criteria
- Paridade funcional total em produção
- Backup + restore comprovados
- Custo ≤ $15/mês; zero dependência de Vercel/Supabase
