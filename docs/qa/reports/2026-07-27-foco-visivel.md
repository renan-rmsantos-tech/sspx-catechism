# QA Run Report — 2026-07-27 — foco visível

- **Scope:** Task 02 — WCAG 2.4.7 Focus Visible em todas as superfícies do produto.
- **Cadence tier:** targeted
- **Build:** workspace local · **Environment:** `http://localhost:5173`, Chromium headless, API simulada por rota para estados determinísticos.
- **Started:** 2026-07-27 · **Status:** closed

## Session Matrix & Results

| # | Superfície | Técnica | Status | Resultado |
|---|---|---|---|---|
| 1 | Acesso | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 2 | Troca de senha | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 3 | Painel do catequista | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 4 | Folha de chamada | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 5 | Inscrição pública | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 6 | Admin — anos | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 7 | Admin — calendário | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 8 | Admin — turmas | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 9 | Admin — alunos | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 10 | Admin — catequistas | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 11 | Admin — inscrições | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |
| 12 | Admin — relatórios | Tab no primeiro controle | Pass | `outline: solid 2px`, offset `2px` |

## Targeted Interaction Checks

- Busca da chamada: foco programático no campo retornou `outline: solid 2px`, offset `2px`; o componente não suprime o contorno.
- Controle segmentado da linha de chamada: botão de presença retornou `outline: solid 2px`, offset `2px`.
- Gaveta de revisão de inscrição: foco no primeiro controle interno retornou `outline: solid 2px`, offset `2px`; o contrato de primitivos também percorre por Tab o botão de fechar.
- Item de navegação da barra lateral: o contrato de primitivos o alcança por Tab e não contém utilitário de supressão de contorno.

## Final Status

- **Exit gate (targeted):** `npm test -- --run src/test/design-fidelity/design-fidelity.test.ts src/components/ui/anchor-components.test.tsx src/pages/dashboard/dashboard-page.test.tsx` — 37 testes aprovados.
- **Build:** `npm run build` — aprovado.
- **Cobertura:** `npm run test:coverage` — 88,73% statements, 89,97% lines e 77,58% branches. O threshold de branches não é aplicado pela configuração atual, lacuna já registrada no TechSpec e fora do escopo desta tarefa.
- **Verdict:** ready — as doze superfícies e os controles com maior risco de colisão exibem o anel de foco definido pelo design system.
