---
status: completed
title: Frontend Vite — scaffold, cliente API, auth context, guarda de rotas, login
type: frontend
complexity: high
dependencies:
  - task_03
---

# Task 13: Frontend Vite — scaffold, cliente API, auth context, guarda de rotas, login

## Overview
Cria a base do frontend como SPA Vite/React: estrutura do projeto, Tailwind/shadcn migrados, cliente HTTP para a API Go (cookies same-origin), contexto de autenticação, guarda de rotas por papel (substitui o `proxy.ts`) e as telas de login e troca de senha. Habilita o login ponta a ponta no navegador.

<requirements>
- MUST usar Vite + React + React Router + Tailwind/shadcn
- MUST chamar a API com `fetch` + `credentials: 'include'` (mesma origem)
- MUST prover auth context consumindo `/api/auth/me` e guarda de rotas por papel
- MUST implementar login e troca obrigatória de senha
- MUST forçar `must_change_password` para a tela de troca
</requirements>

## Subtasks
- [x] 13.1 Scaffold Vite (estrutura `frontend/`, Tailwind v4, shadcn, aliases)
- [x] 13.2 Cliente de API (wrapper fetch + tratamento de erro/401)
- [x] 13.3 Auth context + guarda de rotas por papel
- [x] 13.4 Telas de login e troca de senha
- [x] 13.5 Testes (Vitest) do cliente/guards/telas

## Implementation Details
Ver TechSpec §System Architecture e ADR-002. Reaproveitar componentes/estilos do app Next atual (`components/ui/*`, Tailwind). Roteamento por papel: `/admin/*` (coordenador/admin), `/dashboard/*` (catequista), `/` e `/login` públicos.

### Relevant Files
- `frontend/` — novo projeto Vite
- `components/`, `app/(auth)/login/*`, `lib/auth/routing.ts` (Next atual) — referência de UI/regras

### Dependent Files
- task_14, task_15 (consomem cliente API e auth context)
- `infra/Caddy.Dockerfile` (task_01) — builda `frontend/`

### Related ADRs
- [ADR-002: SPA Vite/React](./adrs/adr-002.md) · [ADR-004](./adrs/adr-004.md)

## Deliverables
- SPA Vite com login funcional contra a API Go
- Cliente de API + auth context + guards
- Testes Vitest com 80%+ cobertura nos módulos novos **(REQUIRED)**

## Tests
- Unit (Vitest):
  - [x] cliente de API trata 401/erros
  - [x] guard redireciona por papel; `must_change_password` força troca
- Integração:
  - [x] login → cookie → navegação para área correta (fetch mockado)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- Login e troca de senha funcionais no navegador
- Guarda de rotas equivalente ao `proxy.ts` antigo
