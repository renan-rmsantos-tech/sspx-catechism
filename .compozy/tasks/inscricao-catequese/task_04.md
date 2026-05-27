---
status: pending
domain: fullstack
type: feature
scope: enrollment
complexity: medium
dependencies: ["01", "02"]
---

# Task 04: Painel admin — lista de inscrições (`/admin/inscricoes`)

## Overview

Criar a página de listagem de inscrições no painel admin com filtros por status, contadores de pendentes/aprovadas/rejeitadas, busca por nome e indicação visual de renovações. Segue o padrão visual e técnico de `app/admin/alunos/page.tsx`.

## Requirements

1. Página server component em `/admin/inscricoes`
2. Contadores no topo: pendentes, aprovadas, rejeitadas
3. Filtro por status (tabs ou botões) — default: pendentes
4. Busca por nome do catequizando
5. Indicação visual (badge) para inscrições marcadas como renovação
6. Lista com nome, data de envio, status, e link para detalhe
7. Acessível apenas para coordenador/admin (já coberto pelo middleware)

## Subtasks

- [ ] Criar `app/admin/inscricoes/page.tsx` — server component com query e filtros
- [ ] Implementar contadores de status via query agregada
- [ ] Implementar filtro por status via searchParams
- [ ] Implementar busca por nome via searchParam `q`
- [ ] Renderizar lista com badge de renovação e link para `[id]`
- [ ] Escrever testes de integração para a query

## Implementation Details

### Files to Create

- `app/admin/inscricoes/page.tsx`

### Integration Points

- `createSupabaseServerClient()` para queries (RLS garante acesso apenas de coordenador)
- `searchParams: Promise<{ status?: string; q?: string }>` — mesmo padrão de `alunos/page.tsx`
- Query: `supabase.from('enrollments').select('*').eq('academic_year_id', activeYear.id)` com filtros condicionais
- Contadores: query separada ou contagem client-side dos resultados

## Relevant Files

- `app/admin/alunos/page.tsx` — padrão de lista com busca e filtros
- `lib/supabase/server.ts` — `createSupabaseServerClient()`

## Dependent Files

- `app/admin/inscricoes/[id]/page.tsx` (task 05) — links da lista apontam para detalhe

## Deliverables

- [ ] Página `/admin/inscricoes` funcional
- [ ] Contadores por status visíveis
- [ ] Filtros por status e busca por nome
- [ ] Badge de renovação nas inscrições marcadas
- [ ] Testes de integração para query

## Tests

### Integração

- [ ] Listagem retorna apenas inscrições do ano letivo ativo
- [ ] Filtro por status retorna apenas inscrições com o status selecionado
- [ ] Busca por nome filtra corretamente (case-insensitive)
- [ ] Contadores refletem quantidades corretas por status

### Manual — UI

- [ ] Página carrega com filtro default em "pendentes"
- [ ] Troca de filtro atualiza a lista
- [ ] Badge de renovação aparece corretamente
- [ ] Link de cada inscrição leva ao detalhe

## Success Criteria

- Coordenador vê lista organizada de inscrições com filtros funcionais
- Contadores permitem visão rápida do status geral
- Renovações são identificáveis visualmente
