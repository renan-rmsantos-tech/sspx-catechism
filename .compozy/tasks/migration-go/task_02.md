---
status: completed
domain: Database
type: Migration
scope: Full
complexity: high
dependencies:
  - task_01
---

# Task 2: Fundação do backend — módulo Go, config, pgx, migrações goose + schema

## Overview
Cria a base do backend Go: módulo, carregamento de configuração, pool pgx, runner de migrações goose embarcadas e o schema consolidado do Postgres já **sem os artefatos do Supabase** (RLS, schema `private`, FK para `auth.users`). É o alicerce de dados de todo o backend.

<requirements>
- MUST usar pgx (pool) e goose (migrações embarcadas via embed.FS)
- MUST recriar todas as tabelas atuais sem dependência de Supabase
- MUST mover email + password_hash para `profiles` (antes em auth.users)
- MUST manter o trigger `validate_class_date_day` (puro Postgres)
- MUST gerar acesso a dados type-safe via sqlc
</requirements>

## Subtasks
- [x] 2.1 Inicializar módulo Go e `config.Load()` a partir de env
- [x] 2.2 Conectar pool pgx e aplicar migrações goose no startup
- [x] 2.3 Escrever migração `0001_init.sql` (schema consolidado + trigger + pgcrypto)
- [x] 2.4 Configurar sqlc e gerar o pacote `sqlcgen`
- [x] 2.5 Helpers de conversão pgtype (UUID lenientes, não-RFC4122)

## Implementation Details
Ver TechSpec §Data Models. `profiles` ganha `email UNIQUE` e `password_hash`. RLS/policies/`private`/`handle_new_user`/GRANTs Supabase removidos. Trigger de validação de dia de aula mantido. UUID leniente preserva o comportamento do antigo `zPgUuid`.

### Relevant Files
- `backend/go.mod`, `backend/sqlc.yaml`
- `backend/internal/config/config.go`
- `backend/internal/database/database.go`
- `backend/db/embed.go`, `backend/db/migrations/0001_init.sql`
- `backend/db/queries/users.sql`, `backend/internal/db/sqlcgen/*`
- `backend/internal/pgconv/pgconv.go`

### Dependent Files
- Todos os pacotes de domínio do backend (consomem `sqlcgen` e o pool)

### Related ADRs
- [ADR-003: chi + pgx + sqlc, migrações goose](./adrs/adr-003.md)

## Deliverables
- Schema aplicável via goose no startup
- Pacote sqlc gerado
- `go build`/`go vet` limpos **(REQUIRED)**
- Teste de aplicação de migrações contra Postgres real **(REQUIRED)**

## Tests
- Unit:
  - [x] `pgconv.ParseUUID` aceita UUID dashed e 32-hex sem dashes
- Integração:
  - [x] Migrações aplicam num Postgres limpo (smoke executado)
  - [ ] `validate_class_date_day` rejeita data em dia não permitido
- Test coverage target: >=80% nos helpers
- All tests must pass

## Success Criteria
- `go build ./...` e `go vet ./...` limpos
- Migrações sobem do zero sem erro
- Esquema bate com o modelo do TechSpec
