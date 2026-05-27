---
status: completed
domain: fullstack
type: feature
scope: enrollment
complexity: medium
dependencies: ["01"]
---

# Task 06: Configuração do período de inscrição no ano letivo

## Overview

Permitir que o coordenador defina datas de abertura e fechamento das inscrições no cadastro do ano letivo, adicionando campos na API existente e na interface de configuração.

## Requirements

1. API `PUT /api/academic-years/[id]` aceita `enrollment_starts_at` e `enrollment_ends_at`
2. Validação: `enrollment_ends_at` deve ser posterior a `enrollment_starts_at` quando ambos fornecidos
3. Interface no admin para definir as datas (inline no formulário de ano letivo ou seção dedicada)
4. Datas exibidas em formato brasileiro (DD/MM/AAAA)

## Subtasks

- [x] Atualizar schema de validação do `PUT /api/academic-years/[id]` para incluir campos de data
- [x] Atualizar handler para persistir as novas colunas (via server action)
- [x] Adicionar campos de data na UI de configuração do ano letivo
- [x] Validar que `enrollment_ends_at > enrollment_starts_at` (Zod refine)
- [ ] Escrever testes para a API atualizada (requer Supabase local)

## Implementation Details

### Files to Modify

- `app/api/academic-years/[id]/route.ts` — adicionar campos ao schema e handler PUT
- UI de configuração do ano letivo (localizar componente existente ou criar seção)

### Integration Points

- Schema de validação existente em `updateAcademicYearSchema` — adicionar `enrollment_starts_at` e `enrollment_ends_at` como dates opcionais
- Os campos são lidos pelo server component de `/inscricao` (task 03) para verificar período
- Formato de data: input type `date` no HTML gera `YYYY-MM-DD`

## Relevant Files

- `app/api/academic-years/[id]/route.ts` — handler PUT existente
- `supabase/migrations/0002_enrollments.sql` (task 01) — colunas adicionadas

## Dependent Files

- `app/inscricao/page.tsx` (task 03) — lê datas para verificar período

## Deliverables

- [x] API aceita e persiste datas de inscrição
- [x] UI permite definir datas no ano letivo
- [x] Validação de datas funcional
- [ ] Testes da API (requer Supabase local)

## Tests

### Integração — API

- [ ] PUT com datas válidas persiste corretamente
- [ ] PUT com `enrollment_ends_at < enrollment_starts_at` retorna erro
- [ ] PUT sem datas (opcionais) funciona sem erro
- [ ] GET retorna datas quando definidas

### Manual — UI

- [ ] Campos de data aparecem na configuração do ano letivo
- [ ] Datas salvas são exibidas corretamente ao reabrir

## Success Criteria

- Coordenador consegue definir período de inscrição para o ano letivo
- Período é respeitado pelo formulário público
