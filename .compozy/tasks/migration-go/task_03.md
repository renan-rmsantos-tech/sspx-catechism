---
status: completed
title: Autenticação — JWT em cookie httpOnly, bcrypt, middleware, bootstrap admin
type: backend
complexity: high
dependencies:
  - task_02
---

# Task 3: Autenticação — JWT em cookie httpOnly, bcrypt, middleware, bootstrap admin

## Overview
Substitui o Supabase Auth por autenticação própria em Go: login por e-mail/senha (bcrypt), sessão via JWT em cookie httpOnly, middlewares de proteção e bootstrap idempotente do admin no startup. Preserva os fluxos atuais incluindo a troca obrigatória de senha.

<requirements>
- MUST autenticar via e-mail/senha com hash bcrypt
- MUST emitir JWT (id+role) em cookie httpOnly+SameSite=Lax (Secure em produção)
- MUST prover middlewares RequireAuth e RequireCoordinator
- MUST suportar `must_change_password` e troca de senha
- MUST semear o admin de forma idempotente no startup
</requirements>

## Subtasks
- [x] 3.1 JWT (issue/parse HS256) e hashing bcrypt + gerador de senha memorável
- [x] 3.2 Middlewares RequireAuth/RequireCoordinator + extração de claims do contexto
- [x] 3.3 Serviço de usuários (Authenticate, ChangePassword, CreateCatechist, BootstrapAdmin)
- [x] 3.4 Handlers `/api/auth/{login,logout,me,change-password}` + cookie helpers
- [x] 3.5 Bootstrap do admin no `main.go`

## Implementation Details
Ver TechSpec §Core Interfaces e ADR-004. JWT carrega `sub`+`role` para evitar consulta por request. Login retorna `{role, mustChangePassword}`. Criação de catequista gera senha em texto puro (exibida uma vez) e seta `must_change_password`.

### Relevant Files
- `backend/internal/auth/{jwt,password}.go`
- `backend/internal/httpx/{middleware,respond}.go`
- `backend/internal/users/service.go`
- `backend/internal/server/{server,auth_handlers,catechist_handlers}.go`
- `backend/cmd/api/main.go`

### Dependent Files
- Todas as rotas protegidas (usam os middlewares e o contexto de claims)
- `frontend/` auth (task_13) consome `/api/auth/*`

### Related ADRs
- [ADR-004: JWT cookie httpOnly + autorização na app](./adrs/adr-004.md)

## Deliverables
- Fluxos de auth funcionais ponta a ponta
- Bootstrap idempotente do admin
- Testes de auth e de middleware **(REQUIRED)**

## Tests
- Unit:
  - [x] bcrypt hash/verify; senha errada falha
  - [x] JWT roundtrip; expirado e segredo errado falham
  - [x] RequireAuth: sem cookie→401, cookie válido→200
  - [x] RequireCoordinator: catechist→403, coordinator/admin→200
- Integração:
  - [x] login seta cookie e retorna role; senha errada→401; `/me` com cookie; rota protegida sem cookie→401 (smoke executado)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- 9 testes verdes (executado)
- Smoke de integração ponta a ponta passando
- Nenhuma dependência de Supabase Auth
