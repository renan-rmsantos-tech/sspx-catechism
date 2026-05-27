---
status: pending
domain: fullstack
type: feature
scope: enrollment
complexity: high
dependencies: ["04"]
---

# Task 05: Painel admin — detalhe e ações aprovar/rejeitar (`/admin/inscricoes/[id]`)

## Overview

Criar a página de detalhe de uma inscrição com todos os dados preenchidos pelo pai, e as ações de aprovar (com seletor de turma, criando o aluno) e rejeitar (com motivo opcional). Para renovações, permitir busca e vínculo com aluno existente.

## Requirements

1. Página server component exibindo todos os dados da inscrição
2. Indicação clara se é renovação, mostrando o nome anterior
3. Ação de aprovar: seletor de turma obrigatório → cria registro em `students` → atualiza enrollment
4. Para renovações: opção de buscar e vincular aluno existente (atualiza em vez de criar)
5. Ação de rejeitar: campo de motivo opcional → atualiza enrollment
6. Ambas ações registram `reviewed_by` e `reviewed_at`
7. Inscrições já processadas (approved/rejected) exibem resultado e não permitem nova ação

## Subtasks

- [ ] Criar `app/admin/inscricoes/[id]/page.tsx` — server component com dados completos
- [ ] Criar `app/admin/inscricoes/actions.ts` — `approveEnrollment` e `rejectEnrollment`
- [ ] Implementar seletor de turma na aprovação (query `classes` do ano ativo)
- [ ] Implementar busca de aluno existente para renovações
- [ ] Copiar dados da inscrição para `students` na aprovação (mesma transaction)
- [ ] Mostrar resultado para inscrições já processadas (turma atribuída, motivo da rejeição)
- [ ] Escrever testes de integração para ambas ações

## Implementation Details

### Related ADRs

- ADR-003: Dados copiados de enrollments para students na aprovação

### Files to Create

- `app/admin/inscricoes/[id]/page.tsx`
- `app/admin/inscricoes/actions.ts`

### Integration Points

- `approveEnrollment` flow:
  1. Busca enrollment por ID
  2. Se `existing_student_id` fornecido (renovação com vínculo): atualiza `students` existente com dados novos + `class_id`
  3. Senão: insere novo `students` com dados do enrollment + `class_id`
  4. Atualiza enrollment: `status = 'approved'`, `approved_student_id`, `approved_class_id`, `reviewed_by`, `reviewed_at`
- `rejectEnrollment` flow:
  1. Atualiza enrollment: `status = 'rejected'`, `rejection_reason`, `reviewed_by`, `reviewed_at`
- `getCoordinatorClient()` padrão de `app/admin/alunos/actions.ts`
- `revalidatePath('/admin/inscricoes')` após ação
- Query de turmas: `supabase.from('classes').select('id, name').eq('academic_year_id', activeYear.id).eq('is_archived', false)`

## Relevant Files

- `app/admin/alunos/actions.ts` — padrão de `getCoordinatorClient()`, `createStudentAction`
- `app/admin/alunos/[id]/editar/page.tsx` — padrão de página de detalhe/edição
- `lib/supabase/server.ts` — clients
- `__tests__/students.test.ts` — padrão de teste com mocks

## Dependent Files

- `app/admin/inscricoes/page.tsx` (task 04) — lista redireciona para esta página
- `components/sidebar.tsx` (task 07) — badge de pendentes

## Deliverables

- [ ] Página de detalhe com todos os dados da inscrição
- [ ] Ação de aprovar cria/vincula aluno com turma
- [ ] Ação de rejeitar com motivo opcional
- [ ] Inscrições processadas mostram resultado sem ações
- [ ] Testes de integração para `approveEnrollment` e `rejectEnrollment`

## Tests

### Integração — approveEnrollment

- [ ] Cria novo student com dados corretos e class_id
- [ ] Atualiza enrollment com `status='approved'`, `approved_student_id`, `approved_class_id`
- [ ] Registra `reviewed_by` e `reviewed_at`
- [ ] Para renovação com `existing_student_id`: atualiza student existente em vez de criar
- [ ] Rejeita se enrollment já foi processado (não é `pending`)
- [ ] Rejeita sem `class_id`

### Integração — rejectEnrollment

- [ ] Atualiza status para `rejected`
- [ ] Salva `rejection_reason` quando fornecido
- [ ] Registra `reviewed_by` e `reviewed_at`
- [ ] Rejeita se enrollment já foi processado

### Manual — UI

- [ ] Dados da inscrição exibidos corretamente
- [ ] Indicação de renovação com nome anterior
- [ ] Seletor de turma funciona na aprovação
- [ ] Inscrição aprovada mostra turma atribuída
- [ ] Inscrição rejeitada mostra motivo

## Success Criteria

- Coordenador consegue aprovar inscrição atribuindo turma, resultando em aluno criado
- Coordenador consegue rejeitar inscrição com motivo
- Renovações podem ser vinculadas a alunos existentes
- Fluxo completo testável: inscrição → aprovação → aluno na turma
