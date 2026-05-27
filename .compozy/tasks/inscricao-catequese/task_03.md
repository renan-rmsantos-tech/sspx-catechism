---
status: pending
domain: fullstack
type: feature
scope: enrollment
complexity: high
dependencies: ["01", "02"]
---

# Task 03: Formulário público de inscrição (`/inscricao`)

## Overview

Implementar a página pública `/inscricao` com o formulário de inscrição na catequese, acessível sem autenticação. Inclui verificação de período, formulário com campo condicional de renovação, server action com service role, e tela de confirmação.

## Requirements

1. Rota `/inscricao` acessível sem autenticação (adicionada a `PUBLIC_PATHS`)
2. Server component verifica período de inscrição no ano letivo ativo
3. Fora do período: exibe mensagem "inscrições encerradas" sem formulário
4. Formulário mobile-first com campos agrupados ("Dados do Catequizando", "Dados do Responsável")
5. Campo condicional "nome anterior" visível apenas quando "já frequentou" é marcado
6. Server action insere via `createSupabaseAdminClient()` (service role)
7. Tela de confirmação após envio bem-sucedido
8. Validação Zod no servidor com feedback de erros

## Subtasks

- [ ] Adicionar `/inscricao` a `PUBLIC_PATHS` em `lib/auth/routing.ts`
- [ ] Criar `app/inscricao/page.tsx` — server component com verificação de período
- [ ] Criar `app/inscricao/enrollment-form.tsx` — client component com `useActionState`
- [ ] Criar `app/inscricao/actions.ts` — `submitEnrollment` server action
- [ ] Implementar estado de confirmação após envio bem-sucedido
- [ ] Estilizar mobile-first seguindo padrão visual do app (CSS vars, `rounded-2xl`, etc.)
- [ ] Escrever testes para o server action

## Implementation Details

### Related ADRs

- ADR-001: Formulário público simples sem autenticação
- ADR-002: Formulário único com flag de renovação
- ADR-004: Server action com service role para inserção pública

### Files to Create

- `app/inscricao/page.tsx`
- `app/inscricao/enrollment-form.tsx`
- `app/inscricao/actions.ts`

### Files to Modify

- `lib/auth/routing.ts` — adicionar `/inscricao` a `PUBLIC_PATHS`

### Integration Points

- `createSupabaseAdminClient()` de `lib/supabase/server.ts` para inserção
- `enrollmentSchema` e `extractEnrollmentBody` de `lib/enrollments/` (task 02)
- `ActionState` pattern: `{ error: string } | { success: true } | null`
- Verificação de período: query `academic_years` com `is_active = true`, comparar `enrollment_starts_at <= today <= enrollment_ends_at`
- Formulário usa CSS vars existentes: `var(--accent)`, `var(--surface)`, `var(--border)`, `var(--text-primary)`

## Relevant Files

- `lib/auth/routing.ts` — `PUBLIC_PATHS` atual
- `proxy.ts` — middleware de autenticação
- `components/admin/student-form.tsx` — padrão de formulário com `useActionState`
- `app/admin/alunos/actions.ts` — padrão de server action
- `lib/supabase/server.ts` — `createSupabaseAdminClient()`

## Dependent Files

- `lib/enrollments/schemas.ts` (task 02) — schema de validação
- `lib/enrollments/helpers.ts` (task 02) — extração de FormData

## Deliverables

- [ ] Página `/inscricao` acessível publicamente
- [ ] Formulário funcional com todos os campos do PRD
- [ ] Campo condicional de renovação
- [ ] Verificação de período com mensagem de encerrado
- [ ] Confirmação após envio
- [ ] Testes do server action

## Tests

### Integração — Server Action

- [ ] `submitEnrollment` insere enrollment com status `pending` e dados corretos
- [ ] `submitEnrollment` retorna erro quando fora do período de inscrição
- [ ] `submitEnrollment` retorna erro com dados inválidos (validação Zod)
- [ ] `submitEnrollment` associa ao `academic_year_id` do ano ativo
- [ ] `submitEnrollment` salva `is_renewal` e `previous_name` corretamente

### Manual — UI

- [ ] Formulário renderiza corretamente em mobile (360px)
- [ ] Campo "nome anterior" aparece/desaparece ao marcar renovação
- [ ] Mensagem de "inscrições encerradas" quando fora do período
- [ ] Mensagem de confirmação após envio com sucesso
- [ ] Erros de validação exibidos no formulário

## Success Criteria

- Pai consegue acessar `/inscricao`, preencher e enviar sem login
- Inscrição aparece no banco com status `pending`
- Formulário funcional em mobile e desktop
- Fora do período, formulário não é exibido
