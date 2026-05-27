---
status: completed
domain: backend
type: feature
scope: enrollment
complexity: low
dependencies: ["01"]
---

# Task 02: Zod schemas e helpers para enrollments

## Overview

Criar os schemas de validação Zod e funções helper para extrair dados de formulário, estabelecendo a camada de validação compartilhada entre o formulário público e as ações do admin.

## Requirements

1. Criar `enrollmentSchema` com todos os campos do formulário público conforme TechSpec
2. Reutilizar o padrão de `phoneRegex` e date regex de `lib/students/schemas.ts`
3. Criar `extractEnrollmentBody(formData)` para converter FormData em objeto tipado
4. Exportar tipos TypeScript derivados do schema

## Subtasks

- [x] Criar `lib/enrollments/schemas.ts` com `enrollmentSchema` e tipos exportados
- [x] Criar `lib/enrollments/helpers.ts` com `extractEnrollmentBody`
- [x] Escrever testes unitários para o schema (campos obrigatórios, formatos, opcionais)
- [x] Escrever testes para `extractEnrollmentBody` (conversão de FormData)

## Implementation Details

### Files to Create

- `lib/enrollments/schemas.ts`
- `lib/enrollments/helpers.ts`
- `__tests__/enrollments-schemas.test.ts`

### Integration Points

- Reutilizar `phoneRegex` de `lib/students/schemas.ts` (extrair para shared se necessário, ou duplicar)
- Seguir padrão de `extractStudentBody` para o helper de extração
- Booleans no formulário usam radio pairs com valores `"true"`/`"false"` — helper deve converter com `=== 'true'`

## Relevant Files

- `lib/students/schemas.ts` — padrão de Zod schema existente, `phoneRegex`, `dateRegex`
- `app/admin/alunos/actions.ts` — padrão de `extractStudentBody`
- `__tests__/students.test.ts` — padrão de testes existente

## Dependent Files

- `app/inscricao/actions.ts` (task 03) — usa schema e helper
- `app/admin/inscricoes/actions.ts` (task 05) — usa schema para validação

## Deliverables

- [x] `enrollmentSchema` Zod com todos os campos do formulário
- [x] `EnrollmentInput` type exportado
- [x] `extractEnrollmentBody` helper funcional
- [x] Testes com ≥80% cobertura do schema e helper (19/19 tests passing)

## Tests

### Unitários — Schema

- [ ] Aceita dados válidos completos
- [ ] Rejeita `full_name` com menos de 3 caracteres
- [ ] Rejeita `birth_date` com formato inválido
- [ ] Rejeita `guardian_phone` com formato inválido
- [ ] Rejeita `guardian_email` com formato inválido
- [ ] Aceita campos opcionais como undefined/null
- [ ] `is_renewal = false` não exige `previous_name`

### Unitários — Helper

- [ ] Converte FormData com todos os campos corretamente
- [ ] Converte booleans de `"true"`/`"false"` string para boolean
- [ ] Trata campos opcionais ausentes como undefined

## Success Criteria

- Schema valida corretamente todos os formatos de campo
- Helper extrai dados de FormData sem perda
- Todos os testes passam
