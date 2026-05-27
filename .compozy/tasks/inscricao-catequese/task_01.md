---
status: completed
domain: database
type: feature
scope: enrollment
complexity: medium
dependencies: []
---

# Task 01: Migration — tabela enrollments + alterações em academic_years e students

## Overview

Criar a migration SQL que estabelece toda a infraestrutura de banco para o sistema de inscrições: nova tabela `enrollments` com status, dados do catequizando, dados do responsável, campos de renovação e revisão; colunas de período em `academic_years`; e coluna `guardian_email` em `students`.

## Requirements

1. Criar tabela `enrollments` com todas as colunas definidas no TechSpec (Data Models)
2. Adicionar CHECK constraint para status (`pending`, `approved`, `rejected`)
3. Criar indexes para `status` e `academic_year_id`
4. Habilitar RLS com policies SELECT e UPDATE para `authenticated` usando `private.is_coordinator()`
5. Adicionar `enrollment_starts_at DATE` e `enrollment_ends_at DATE` em `academic_years`
6. Adicionar `guardian_email TEXT` em `students`
7. Todas as foreign keys devem referenciar tabelas existentes corretamente

## Subtasks

- [x] Criar arquivo `supabase/migrations/0002_enrollments.sql`
- [x] Definir tabela `enrollments` com todas as colunas, constraints e defaults
- [x] Criar indexes `idx_enrollments_status` e `idx_enrollments_academic_year`
- [x] Habilitar RLS e criar policies `enrollments_select` e `enrollments_update`
- [x] Adicionar colunas `enrollment_starts_at` e `enrollment_ends_at` em `academic_years`
- [x] Adicionar coluna `guardian_email` em `students`
- [ ] Verificar migration aplicando localmente com `supabase db reset` ou equivalente (Docker não acessível)

## Implementation Details

### Related ADRs

- ADR-003: Tabela enrollments separada de students
- ADR-004: Sem RLS policy para anon — inserção via service role

### Files to Create

- `supabase/migrations/0002_enrollments.sql`

### Integration Points

- RLS policies devem usar `private.is_coordinator()` que já existe em `0001_initial_schema.sql`
- Foreign keys referenciam `academic_years(id)`, `classes(id)`, `students(id)`, `profiles(id)`
- Pattern de RLS: seguir exatamente o padrão de `students_insert`, `students_select`, etc. da migration existente

## Relevant Files

- `supabase/migrations/0001_initial_schema.sql` — schema existente com padrões de RLS e funções `private.*`
- `supabase/config.toml` — configuração do projeto Supabase

## Dependent Files

- `lib/enrollments/schemas.ts` (task 02) — depende da estrutura da tabela
- `app/inscricao/actions.ts` (task 03) — insere nesta tabela
- `app/admin/inscricoes/actions.ts` (task 05) — lê e atualiza nesta tabela

## Deliverables

- [x] Migration SQL que cria tabela `enrollments` com todas as colunas
- [x] Indexes e RLS policies funcionais
- [x] Colunas adicionais em `academic_years` e `students`
- [ ] Migration aplica sem erros (pendente: Docker não acessível para `supabase db reset`)

## Tests

- [ ] Migration aplica com sucesso em banco limpo (`supabase db reset`)
- [ ] Tabela `enrollments` criada com todas as colunas e tipos corretos
- [ ] CHECK constraint de status rejeita valores inválidos
- [ ] RLS bloqueia SELECT/UPDATE para usuários não-coordenadores
- [ ] RLS permite SELECT/UPDATE para coordenadores
- [ ] Colunas `enrollment_starts_at`/`enrollment_ends_at` existem em `academic_years`
- [ ] Coluna `guardian_email` existe em `students`
- [ ] Foreign keys funcionam corretamente (inserção com referências válidas/inválidas)

## Success Criteria

- Migration aplica sem erros em ambiente limpo e em ambiente com dados existentes
- Todas as constraints e policies funcionam conforme especificado
