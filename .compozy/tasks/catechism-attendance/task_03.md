---
title: Autenticação e Proteção de Rotas
status: completed
type: backend
complexity: medium
dependencies:
  - task_01
  - task_02
---

# Task 3: Autenticação e Proteção de Rotas

## Overview
Implementa o fluxo de login com e-mail + senha via Supabase Auth e o middleware de proteção de rotas baseado em role. Garante que coordenadores acessem apenas `/admin/*` e catequistas apenas `/dashboard/*`, com redirecionamento automático para `/login` quando não autenticado.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implementar login com e-mail + senha usando `supabase.auth.signInWithPassword()`
- MUST proteger todas as rotas via `middleware.ts` na raiz do projeto
- MUST redirecionar para `/login` se não autenticado
- MUST redirecionar para `/dashboard` se catequista tentar acessar `/admin/*`
- MUST redirecionar para `/admin` se coordenador tentar acessar `/dashboard/*`
- MUST ler o role do `profiles` (não de `user_metadata`) para decisão de rota
- MUST implementar logout que limpa a sessão e redireciona para `/login`
- A página de login NÃO deve ser acessível para usuários já autenticados
</requirements>

## Subtasks
- [x] 3.1 Criar página `/login` com formulário e-mail + senha (validação com react-hook-form + zod)
- [x] 3.2 Implementar Server Action de login que chama `supabase.auth.signInWithPassword()`
- [x] 3.3 Implementar Server Action de logout que chama `supabase.auth.signOut()`
- [x] 3.4 Criar `proxy.ts` (Next.js 16) com lógica de proteção por role (ler role da tabela `profiles`)
- [x] 3.5 Criar páginas placeholder para `/admin` e `/dashboard` para validar o fluxo de redirecionamento
- [x] 3.6 Tratar erros de autenticação (credenciais inválidas, conta inexistente) com mensagem amigável

## Implementation Details
Consultar TechSpec → **Core Interfaces** para o exemplo de implementação do `middleware.ts`.

O role deve ser lido da tabela `profiles` (não de `user_metadata`) para manter a fonte de verdade no banco com RLS. Use o server client do Supabase no middleware para evitar exposição de tokens.

Estrutura de rotas protegidas:
- `/login` — público, redireciona autenticados para sua rota home
- `/admin/*` — somente `coordinator`
- `/dashboard/*` — somente `catechist`

### Relevant Files
- `app/(auth)/login/page.tsx` — página de login
- `app/(auth)/login/actions.ts` — Server Actions de login e logout
- `middleware.ts` — proteção de rotas
- `lib/supabase/middleware.ts` — helper do Supabase para middleware

### Dependent Files
- `lib/supabase/server.ts` — client usado no middleware e Server Actions
- `supabase/migrations/0001_initial_schema.sql` — tabela `profiles` consultada no middleware

### Related ADRs
- [ADR-002: Stack Técnica — Next.js + Supabase + Vercel](adrs/adr-002.md) — Justifica Supabase Auth com JWT e roles via profiles

## Deliverables
- Página `/login` funcional com validação de formulário
- Middleware de proteção de rotas por role funcionando
- Server Actions de login e logout
- Unit tests com 80%+ coverage **(REQUIRED)**
- Integration tests para fluxo de autenticação e redirecionamentos **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Schema Zod do formulário de login valida e-mail inválido
  - [x] Schema Zod do formulário de login valida senha vazia
  - [x] Middleware redireciona para `/login` quando sem sessão
  - [x] Middleware redireciona catequista que tenta acessar `/admin`
  - [x] Middleware redireciona coordenador que tenta acessar `/dashboard`
- Integration tests:
  - [x] Login com credenciais válidas cria sessão e redireciona para rota correta por role
  - [x] Login com credenciais inválidas retorna mensagem de erro sem redirecionar
  - [x] Logout destrói sessão e redireciona para `/login`
  - [x] Rota `/admin` redireciona para `/dashboard` para catequista autenticado (via routing logic)
  - [x] Rota `/admin` permite coordenador autenticado (via routing logic)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Fluxo completo: login → redirecionamento por role → logout testado manualmente
- Nenhuma rota protegida acessível sem sessão válida
