---
title: Cadastro e Gestão de Alunos
status: completed
type: frontend
complexity: medium
dependencies:
  - task_02
  - task_04
---

# Task 6: Cadastro e Gestão de Alunos

## Overview
Implementa o formulário completo de cadastro de alunos com todos os 13 campos do PRD (dados pessoais, pastorais e de responsáveis), a listagem com busca por nome, a edição e a transferência entre turmas. A tela do Paper "4 — Coordenador: Cadastro de Aluno" é a referência visual obrigatória para o formulário.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- **OBRIGATÓRIO: Consultar Paper screen 4 (Coordenador: Cadastro de Aluno) antes de implementar o formulário**
</critical>

<requirements>
- MUST implementar formulário com os 13 campos do PRD organizados em 3 seções (Dados Pessoais, Dados Pastorais, Responsáveis)
- MUST validar com Zod: `full_name` obrigatório; `birth_date` formato date válido; `guardian_phone` formato de telefone
- MUST implementar busca de alunos por nome (debounced, server-side via `ILIKE`)
- MUST implementar transferência de aluno entre turmas via `PATCH /api/students/[id]` com novo `class_id`
- MUST implementar CRUD completo: `POST /api/students`, `PATCH /api/students/[id]`, `GET /api/students/[id]`
- Campos de texto livre (`previous_catechism`, `religious_books`) NÃO devem ter validação rígida
- Somente o coordenador pode criar, editar e transferir alunos
- MUST consultar Paper screen 4 via MCP para extrair estrutura exata do formulário antes de implementar
</requirements>

## Subtasks
- [x] 6.1 Consultar Paper screen 4 via MCP (`get_jsx`, `get_computed_styles`) e extrair estrutura do formulário de 3 seções
- [x] 6.2 Implementar Route Handlers: `POST /api/students`, `PATCH /api/students/[id]`, `GET /api/students/[id]`, `GET /api/classes/[id]/students`
- [x] 6.3 Criar schema Zod do formulário de aluno com validações dos 13 campos
- [x] 6.4 Implementar página de cadastro `/admin/alunos/novo` com formulário em 3 seções (Paper screen 4)
- [x] 6.5 Implementar página de listagem `/admin/alunos` com busca por nome (debounced)
- [x] 6.6 Implementar página de edição `/admin/alunos/[id]/editar` (reusar formulário)
- [x] 6.7 Implementar ação de transferência de aluno entre turmas no formulário de edição

## Implementation Details
Consultar TechSpec → **API Endpoints** e **Data Models** para os campos da tabela `students`.

**Campos do formulário por seção:**

*Dados Pessoais:* `full_name` (obrigatório), `birth_date`, `city`

*Dados Pastorais:* `first_communion` (toggle Sim/Não), `confirmation` (toggle Sim/Não), `previous_catechism` (texto livre), `religious_books` (texto livre)

*Responsáveis:* `guardian_father_name`, `guardian_mother_name`, `guardian_phone`

**Paper screen 4 mostra:**
- Sidebar com item "Alunos" ativo
- Formulário com 3 seções claramente separadas por cabeçalho de seção em âmbar
- Toggles Sim/Não com fundo âmbar claro quando ativo (`--accent-light`)
- Botão "Salvar Aluno" em âmbar no rodapé do formulário

### Relevant Files
- `app/admin/alunos/page.tsx` — listagem de alunos com busca
- `app/admin/alunos/novo/page.tsx` — formulário de cadastro
- `app/admin/alunos/[id]/editar/page.tsx` — formulário de edição
- `app/api/students/route.ts` — Route Handler de alunos
- `app/api/students/[id]/route.ts` — Route Handler de aluno individual
- `app/api/classes/[id]/students/route.ts` — Route Handler de alunos por turma
- `lib/validations/student.ts` — schema Zod do aluno

### Dependent Files
- `app/admin/layout.tsx` (task_04) — layout com sidebar
- `supabase/migrations/0001_initial_schema.sql` (task_02) — tabela `students`

### Related ADRs
- [ADR-001: Escopo do Produto — MVP Focado](adrs/adr-001.md) — Cadastro completo de alunos é requisito central do MVP

## Deliverables
- Route Handlers completos para students
- Formulário de cadastro/edição com 3 seções (fiel ao Paper screen 4)
- Busca de alunos por nome com debounce
- Fluxo de transferência entre turmas
- Unit tests com 80%+ coverage **(REQUIRED)**
- Integration tests para CRUD de alunos e RLS **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Schema Zod: `full_name` vazio retorna erro de validação
  - [x] Schema Zod: `birth_date` inválida (ex: "32/13/2020") retorna erro
  - [x] Schema Zod: campos de texto livre (`previous_catechism`) aceita qualquer string
  - [x] Toggle Sim/Não renderiza estado ativo com fundo `--accent-light`
- Integration tests:
  - [x] `POST /api/students` por catequista retorna 403
  - [x] `POST /api/students` por coordenador cria aluno e retorna 201
  - [x] `PATCH /api/students/[id]` com novo `class_id` transfere aluno corretamente
  - [x] `GET /api/classes/[id]/students` retorna apenas alunos da turma informada
  - [x] Busca por nome retorna alunos com nome parcialmente correspondente (ILIKE)
- Test coverage target: >=80% — **92%+ achieved**
- All tests must pass — **237/237 passing**

## Success Criteria
- All tests passing
- Test coverage >=80%
- Formulário visual corresponde ao Paper screen 4
- Todos os 13 campos do PRD presentes e funcionais
- Busca por nome funciona em menos de 300ms (debounce 300ms)
- Transferência de turma persiste corretamente no banco
