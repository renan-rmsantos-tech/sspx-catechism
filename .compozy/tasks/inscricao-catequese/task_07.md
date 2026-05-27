---
status: completed
domain: fullstack
type: enhancement
scope: enrollment
complexity: low
dependencies: ["01", "05"]
---

# Task 07: Integração — campo guardian_email em students + sidebar admin

## Overview

Integrar o campo `guardian_email` nos formulários e schemas existentes de alunos, e adicionar o link "Inscrições" na sidebar do admin com badge de contagem de pendentes.

## Requirements

1. Atualizar schemas Zod de students (`createStudentSchema`, `updateStudentSchema`) com `guardian_email`
2. Atualizar `extractStudentBody` para incluir `guardian_email`
3. Atualizar `student-form.tsx` para exibir/editar campo de email
4. Adicionar "Inscrições" na sidebar admin (`components/sidebar.tsx`) no grupo "Gestão"
5. Badge na sidebar mostrando contagem de inscrições pendentes

## Subtasks

- [x] Adicionar `guardian_email` a `createStudentSchema` e `updateStudentSchema`
- [x] Atualizar `extractStudentBody` em `app/admin/alunos/actions.ts`
- [x] Adicionar campo de email no `student-form.tsx` na seção "Responsáveis"
- [x] Adicionar item "Inscrições" na sidebar no grupo "Gestão" após "Alunos"
- [x] Implementar badge de contagem de pendentes na sidebar (query server-side)
- [x] Atualizar testes existentes de students para incluir `guardian_email`

## Implementation Details

### Files to Modify

- `lib/students/schemas.ts` — adicionar `guardian_email: z.string().email().nullable().optional()`
- `app/admin/alunos/actions.ts` — adicionar `guardian_email` em `extractStudentBody`
- `components/admin/student-form.tsx` — novo input de email na seção "Responsáveis"
- `components/sidebar.tsx` — novo `NavItem` no grupo "Gestão" com href `/admin/inscricoes`

### Integration Points

- Sidebar: ícone SVG 18x18 com `fill="none"` e `strokeWidth="2"` (padrão existente, usar ícone de clipboard/document)
- Badge: query `enrollments` com `status = 'pending'` no server component do layout admin
- O badge pode ser passado como prop para `<Sidebar />` ou carregado internamente

## Relevant Files

- `lib/students/schemas.ts` — schemas existentes
- `app/admin/alunos/actions.ts` — `extractStudentBody`
- `components/admin/student-form.tsx` — formulário de aluno
- `components/sidebar.tsx` — navegação admin
- `app/admin/layout.tsx` — layout que renderiza sidebar
- `__tests__/students.test.ts` — testes existentes de students

## Dependent Files

Nenhum — esta é a última tarefa da cadeia.

## Deliverables

- [x] Campo `guardian_email` funcional no formulário de alunos (criar e editar)
- [x] Link "Inscrições" na sidebar admin
- [x] Badge de pendentes na sidebar
- [x] Testes existentes atualizados

## Tests

### Unitários

- [x] `createStudentSchema` aceita `guardian_email` válido
- [x] `createStudentSchema` rejeita `guardian_email` inválido
- [x] `extractStudentBody` inclui `guardian_email`

### Manual — UI

- [ ] Campo de email aparece no formulário de aluno (criar e editar)
- [ ] Link "Inscrições" aparece na sidebar no grupo correto
- [ ] Badge mostra contagem correta de pendentes
- [ ] Badge atualiza após aprovar/rejeitar uma inscrição

## Success Criteria

- Campo de email integrado sem regressão nos formulários existentes
- Sidebar permite navegação direta para inscrições
- Badge dá visibilidade imediata de inscrições pendentes
