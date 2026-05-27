# TechSpec: Formulário Público de Inscrição na Catequese

## Executive Summary

Implementação de um formulário público em `/inscricao` para pais inscreverem filhos na catequese (novos e renovações), com painel de gestão no admin para aprovar/rejeitar inscrições e atribuir turma. Envolve: nova tabela `enrollments`, Server Actions públicos e protegidos, nova seção no admin, e configuração de período de inscrição no ano letivo.

**PRD:** `.compozy/tasks/inscricao-catequese/_prd.md`

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│  Público                                     │
│  /inscricao (page.tsx)                       │
│    └─ EnrollmentForm (client component)      │
│         └─ submitEnrollment (server action)  │
│              └─ createSupabaseAdminClient()   │
│                   └─ INSERT enrollments       │
├─────────────────────────────────────────────┤
│  Admin                                       │
│  /admin/inscricoes (page.tsx)                │
│    └─ EnrollmentList (server component)      │
│  /admin/inscricoes/[id] (page.tsx)           │
│    └─ EnrollmentDetail + ApproveForm         │
│         └─ approveEnrollment (server action) │
│              └─ INSERT students              │
│              └─ UPDATE enrollments            │
│         └─ rejectEnrollment (server action)  │
│              └─ UPDATE enrollments            │
├─────────────────────────────────────────────┤
│  Config                                      │
│  academic_years.enrollment_starts_at/ends_at │
│    └─ Editado via PATCH /api/academic-years  │
└─────────────────────────────────────────────┘
```

### Key Decisions

- Rota `/inscricao` adicionada a `PUBLIC_PATHS` em `lib/auth/routing.ts` para bypass do middleware de autenticação
- Formulário público usa padrão existente: `useActionState` + Server Action + validação Zod
- Server Action público usa `createSupabaseAdminClient()` (service role) para inserir — sem RLS policy para `anon`
- Ações de admin usam `createSupabaseServerClient()` (autenticado) com RLS policies existentes
- Nenhuma nova API route — tudo via Server Actions

---

## Data Models

### Nova tabela: `enrollments`

```sql
CREATE TABLE enrollments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id     UUID NOT NULL REFERENCES academic_years(id),
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Dados do catequizando
  full_name            TEXT NOT NULL,
  birth_date           DATE,
  city                 TEXT,
  first_communion      BOOLEAN DEFAULT FALSE,
  confirmation         BOOLEAN DEFAULT FALSE,
  previous_catechism   TEXT,
  religious_books      TEXT,

  -- Dados do responsável
  guardian_father_name TEXT,
  guardian_mother_name TEXT,
  guardian_phone       TEXT,
  guardian_email       TEXT,

  -- Renovação
  is_renewal           BOOLEAN DEFAULT FALSE,
  previous_name        TEXT,

  -- Revisão pelo admin
  rejection_reason     TEXT,
  approved_class_id    UUID REFERENCES classes(id),
  approved_student_id  UUID REFERENCES students(id),
  reviewed_by          UUID REFERENCES profiles(id),
  reviewed_at          TIMESTAMPTZ,

  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_academic_year ON enrollments(academic_year_id);
```

### Alteração: `academic_years`

```sql
ALTER TABLE academic_years ADD COLUMN enrollment_starts_at DATE;
ALTER TABLE academic_years ADD COLUMN enrollment_ends_at DATE;
```

### Alteração: `students`

```sql
ALTER TABLE students ADD COLUMN guardian_email TEXT;
```

### RLS Policies para `enrollments`

```sql
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY enrollments_select ON enrollments
  FOR SELECT TO authenticated
  USING (private.is_coordinator());

CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE TO authenticated
  USING (private.is_coordinator());
```

Sem policy para `anon` — inserção feita via service role no Server Action.

---

## Core Interfaces

### Zod Schema — Inscrição pública

```ts
// lib/enrollments/schemas.ts
export const enrollmentSchema = z.object({
  full_name: z.string().min(3),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().optional(),
  first_communion: z.boolean(),
  confirmation: z.boolean(),
  previous_catechism: z.string().optional(),
  religious_books: z.string().optional(),
  guardian_father_name: z.string().optional(),
  guardian_mother_name: z.string().optional(),
  guardian_phone: z.string().regex(phoneRegex),
  guardian_email: z.string().email(),
  is_renewal: z.boolean(),
  previous_name: z.string().optional(),
})
```

### Server Action — Envio público

```ts
// app/inscricao/actions.ts
export async function submitEnrollment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState>
```

Fluxo: extrair dados do formData → validar com Zod → buscar ano letivo ativo → verificar período → inserir via `createSupabaseAdminClient()` → retornar sucesso ou erro.

### Server Actions — Admin

```ts
// app/admin/inscricoes/actions.ts
export async function approveEnrollment(
  _prev: ActionState,
  formData: FormData  // enrollment_id + class_id + existing_student_id?
): Promise<ActionState>

export async function rejectEnrollment(
  _prev: ActionState,
  formData: FormData  // enrollment_id + rejection_reason?
): Promise<ActionState>
```

`approveEnrollment`: cria aluno em `students` (ou vincula existente para renovação) → atualiza enrollment com `status='approved'`, `approved_student_id`, `approved_class_id`, `reviewed_by`, `reviewed_at`.

`rejectEnrollment`: atualiza enrollment com `status='rejected'`, `rejection_reason`, `reviewed_by`, `reviewed_at`.

---

## File Structure

```
app/
  inscricao/
    page.tsx              # Server component — verifica período, renderiza form ou mensagem
    actions.ts            # submitEnrollment (público, service role)
    enrollment-form.tsx   # Client component — formulário com useActionState

  admin/
    inscricoes/
      page.tsx            # Lista de inscrições com filtros e contadores
      actions.ts          # approveEnrollment, rejectEnrollment
      [id]/
        page.tsx          # Detalhe da inscrição + ações

lib/
  enrollments/
    schemas.ts            # enrollmentSchema + types
    helpers.ts            # extractEnrollmentBody (formData → object)

supabase/
  migrations/
    0002_enrollments.sql  # Tabela enrollments + alterações em academic_years e students
```

---

## Integration Points

### Middleware (`lib/auth/routing.ts`)

Adicionar `/inscricao` a `PUBLIC_PATHS` para que o middleware não redirecione para login.

### Sidebar Admin

Adicionar link "Inscrições" na navegação do admin, com badge de contagem de pendentes.

### Tabela `students` — campo `guardian_email`

- Adicionar coluna na migration
- Atualizar `createStudentSchema` e `updateStudentSchema` em `lib/students/schemas.ts`
- Atualizar `student-form.tsx` para incluir campo de email
- Atualizar `extractStudentBody` para incluir `guardian_email`

### API `academic-years`

Atualizar `PATCH /api/academic-years/[id]` para aceitar e persistir `enrollment_starts_at` e `enrollment_ends_at`.

---

## Testing Approach

### Testes unitários

- Validação do `enrollmentSchema` — campos obrigatórios, formatos (email, telefone, data)
- Lógica de verificação de período (data dentro/fora do range)

### Testes de integração (Server Actions)

- `submitEnrollment` — insere na tabela `enrollments` com status `pending`
- `submitEnrollment` fora do período — retorna erro
- `approveEnrollment` — cria aluno em `students`, atualiza enrollment
- `rejectEnrollment` — atualiza status e motivo
- Aprovação de renovação com vínculo a aluno existente

### Testes manuais (UI)

- Formulário mobile-first: verificar responsividade
- Campo condicional "nome anterior" aparece/desaparece ao marcar renovação
- Mensagem de "inscrições encerradas" quando fora do período
- Fluxo completo: inscrever → listar no admin → aprovar com turma → verificar aluno criado

---

## Development Sequencing

### Etapa 1 — Database & Schema

- Migration: criar tabela `enrollments`, adicionar colunas em `academic_years` (`enrollment_starts_at`, `enrollment_ends_at`) e `students` (`guardian_email`)
- RLS policies para `enrollments`
- Zod schemas: `enrollmentSchema`, atualizar `createStudentSchema` com `guardian_email`

### Etapa 2 — Formulário Público

- Adicionar `/inscricao` a `PUBLIC_PATHS`
- Server Component `app/inscricao/page.tsx`: verifica período, renderiza form ou mensagem de encerrado
- Client Component `enrollment-form.tsx`: formulário com `useActionState`, campo condicional de renovação
- Server Action `submitEnrollment`: valida, verifica período, insere via admin client
- Tela de confirmação após envio

### Etapa 3 — Painel Admin (Inscrições)

- `app/admin/inscricoes/page.tsx`: lista com filtros por status e contadores
- `app/admin/inscricoes/[id]/page.tsx`: detalhe da inscrição com dados completos
- Server Actions: `approveEnrollment` (cria/vincula aluno + turma), `rejectEnrollment`
- Link na sidebar admin com badge de pendentes

### Etapa 4 — Configuração do Período

- Atualizar API `PATCH /api/academic-years/[id]` para aceitar datas de inscrição
- Adicionar campos de data na UI de configuração do ano letivo

### Etapa 5 — Integração & Polish

- Atualizar formulário admin de alunos com campo `guardian_email`
- Testes
- Verificação mobile do formulário público

---

## Architecture Decision Records

- [ADR-001: Formulário Público Simples sem Autenticação](adrs/adr-001.md) — Formulário público em `/inscricao` sem login do pai; admin revisa e aprova internamente.
- [ADR-002: Formulário Único com Flag de Renovação](adrs/adr-002.md) — Fluxo único para novos e renovações, com campo "já frequentou" e nome anterior para o admin vincular.
- [ADR-003: Tabela Enrollments Separada de Students](adrs/adr-003.md) — Inscrições armazenadas em tabela própria; na aprovação, dados são copiados para `students` com turma atribuída.
- [ADR-004: Server Action com Service Role para Inserção Pública](adrs/adr-004.md) — Inserção pública via Server Action com `createSupabaseAdminClient()`, sem RLS policy para `anon`.
