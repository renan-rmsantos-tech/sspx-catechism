# Conferência — console da coordenação no design system

- Data: 2026-07-28
- Escopo: `/admin/anos`, `/admin/calendario`, `/admin/turmas`, `/admin/alunos`, `/admin/catequistas`, `/admin/inscricoes`, `/admin/relatorios`
- Referência: `design/SKILL.md` §9 e `design/DESIGN.md`
- Método: revisão dos primitivos renderizados e testes de integração das sete rotas.

| Item da checklist | Anos | Calendário | Turmas | Alunos | Catequistas | Inscrições | Relatórios |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sem cor literal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Uma ação primária; desabilitado explica | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Números comparáveis tabulares | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Serifa reservada à marca | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Controles da superfície ≥44px | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Estado de rede visível ao gravar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Estado em chip | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vazio orienta o próximo passo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Regiões e títulos têm `data-od-id` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tabelas encapsuladas; nomes longos não forçam a tela | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gráficos preenchidos e descritos | n/a | n/a | n/a | n/a | n/a | n/a | ✓ |
| Copy pt-BR, concreta e em sentence case | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Evidência automatizada

- `npm test -- --run src/pages/admin/admin-page.test.tsx`: 23 testes verdes, incluindo associação de rótulos nas sete views, indicador de rede e chip de inscrição em português.
- `npm test -- --run src/test/design-fidelity/design-fidelity.test.ts`: a porta não encontrou violações e as três regras de migração estão bloqueantes.
- `npm run lint`: TypeScript sem erros.

## Decisões observáveis

- `Pendente`, `Aprovada` e `Rejeitada` usam `Chip`; renovação usa somente o tom dourado do chip, nunca um botão dourado.
- O vazio das tabelas orienta a criação do primeiro registro em vez de apenas comunicar ausência.
- Os campos usam `Field` + `Input`/`Select`/`Textarea` com `id` correspondente, preservando rótulos e `aria-invalid`.
