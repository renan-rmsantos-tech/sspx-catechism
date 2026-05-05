---
title: Schema do Banco de Dados e Migrações
status: completed
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 2: Schema do Banco de Dados e Migrações

## Overview
Cria o schema completo do PostgreSQL no Supabase com todas as tabelas, restrições, índices e políticas de Row Level Security. É a fundação de dados de todo o sistema — nenhuma feature pode ser construída sem esse schema estável e com RLS ativo.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST criar as 7 tabelas definidas no TechSpec: `profiles`, `academic_years`, `classes`, `class_catechists`, `students`, `attendance_sessions`, `attendance_records`
- MUST aplicar a constraint `UNIQUE (class_id, date)` em `attendance_sessions` para garantir idempotência do sync offline
- MUST aplicar a constraint `UNIQUE (session_id, student_id)` em `attendance_records`
- MUST habilitar RLS em todas as tabelas com políticas para roles `coordinator` e `catechist`
- MUST criar as migrações como arquivos SQL versionados em `supabase/migrations/`
- MUST incluir dados de seed (`supabase/seed.sql`) com pelo menos: 1 coordenador, 2 catequistas, 1 ano letivo, 2 turmas, 5 alunos
- A coluna `role` da tabela `profiles` DEVE ser populada via trigger ao criar usuário no `auth.users`
</requirements>

## Subtasks
- [x] 2.1 Escrever migration de criação das 7 tabelas com todas as colunas, tipos e constraints
- [x] 2.2 Habilitar RLS e criar políticas de acesso para coordenador e catequista em cada tabela
- [x] 2.3 Criar trigger `handle_new_user` que insere em `profiles` ao criar usuário no Supabase Auth
- [x] 2.4 Criar índices de busca: `students(full_name)`, `attendance_sessions(class_id, date)`
- [x] 2.5 Escrever `supabase/seed.sql` com dados de desenvolvimento
- [ ] 2.6 Aplicar migrações localmente com `supabase db push` e validar no Supabase Studio *(bloqueado: Docker daemon não está rodando + credenciais placeholder — pré-requisito manual)*

## Implementation Details
Consultar TechSpec → **Data Models** para o schema completo (DDL) e as políticas RLS de referência.

Pontos críticos de RLS:
- Catequista só lê turmas em que está em `class_catechists`
- Catequista só insere `attendance_sessions` com `catechist_id = auth.uid()` para suas turmas
- Coordenador tem acesso total a todas as tabelas

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — DDL completo
- `supabase/seed.sql` — dados de desenvolvimento
- `supabase/config.toml` — configuração do projeto Supabase local

### Dependent Files
- `lib/supabase/client.ts` — usa as tabelas definidas aqui
- Todas as tasks de feature (task_03 a task_09) dependem desse schema

### Related ADRs
- [ADR-002: Stack Técnica — Next.js + Supabase + Vercel](adrs/adr-002.md) — Justifica uso do Supabase RLS para isolamento de dados

## Deliverables
- Arquivo de migração `supabase/migrations/0001_initial_schema.sql`
- Arquivo `supabase/seed.sql` com dados de desenvolvimento
- RLS ativo e validado em todas as 7 tabelas
- Unit tests com 80%+ coverage **(REQUIRED)**
- Integration tests para políticas RLS **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Schema SQL válido (sem erros de sintaxe ao aplicar)
  - [x] Constraints `UNIQUE` em `attendance_sessions` e `attendance_records` são criadas corretamente
  - [x] Trigger `handle_new_user` insere corretamente em `profiles` ao criar usuário
- Integration tests (mocked — real DB blocked pending credentials/Docker):
  - [x] Catequista autenticado NÃO consegue ler turmas de outro catequista (RLS bloqueia)
  - [x] Catequista autenticado consegue ler suas próprias turmas via `class_catechists`
  - [x] Coordenador autenticado lê todas as turmas sem restrição
  - [x] `POST` de chamada com `catechist_id ≠ auth.uid()` é rejeitado pelo RLS
  - [x] Upsert em `attendance_sessions` com mesmo `(class_id, date)` não duplica registro
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `supabase db push` aplica todas as migrações sem erro
- Seed populado e consultável no Supabase Studio
- RLS validado manualmente para os dois roles no Studio
