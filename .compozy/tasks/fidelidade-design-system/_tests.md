# Tests — Fidelidade ao design system

> Decomposição: [`_tasks.md`](_tasks.md) · Histórias: [`_user_stories.md`](_user_stories.md)

Rastreamento da cobertura de teste da iniciativa. Estado verificado em 2026-07-28.

## Estado da suíte

| Suíte | Resultado | Onde roda |
|---|---|---|
| Frontend (`npx vitest run`) | **104 testes, 0 falhas** | `npm test`, `pre-push`, `infra/Caddy.Dockerfile:13` |
| Backend (`go test ./...`) | **185 testes em 18 pacotes** | `backend/Dockerfile:10` |
| Build da imagem do frontend | **passa** — prova o `COPY` da folha de referência | `docker build --target frontend -f infra/Caddy.Dockerfile .` |

Os testes de integração do Go dão `t.Skip` sem `TEST_DATABASE_URL`, então o portão de deploy roda apenas os unitários — comportamento herdado, não introduzido por esta iniciativa.

## A porta de fidelidade

`frontend/src/test/design-fidelity/design-fidelity.test.ts` — cada regra gera dois casos: a varredura do repositório e a detecção da própria violação plantada. O tipo `Rule` exige `fixture`, então não existe regra registrada sem prova de que funciona.

| Regra | Varredura | Fixture plantado | Nível |
|---|---|---|---|
| `cor-literal` | verde | ✓ | block |
| `foco-apagado` | verde | ✓ | block |
| `classe-inexistente` | verde | ✓ | block |
| `controle-cru` | verde | ✓ | block |
| `apelido-de-variante` | verde | ✓ | block |

Casos adicionais no mesmo arquivo: extração de seletor aninhado (`.table .num-col`), exclusão das classes traduzidas pelo projeto, recursão do varredor com filtro de extensão, bloqueio efetivo após mudança de nível, as três variantes de supressão de contorno, e o reset do matcher global entre arquivos.

## Inventário por tarefa

| Tarefa | Arquivos de teste tocados |
|---|---|
| `task_01` | `src/test/design-fidelity/design-fidelity.test.ts` (novo) · `src/test/color-literals.test.ts` (absorvido e removido) |
| `task_02` | `src/components/ui/anchor-components.test.tsx` |
| `task_03` | `src/components/ui/anchor-components.test.tsx` · `src/pages/admin/admin-page.test.tsx` |
| `task_04` | `src/pages/admin/admin-page.test.tsx` |
| `task_05` | `src/components/ui/anchor-components.test.tsx` · `src/pages/dashboard/dashboard-page.test.tsx` · `src/pages/enrollment/enrollment-page.test.tsx` · `scripts/capture-baseline.test.ts` (novo) |

## Arquivos de teste do frontend

```
scripts/capture-baseline.test.ts
src/App.test.tsx
src/components/auth/login-page.test.tsx
src/components/ui/anchor-components.test.tsx
src/contexts/auth-context.test.tsx
src/lib/{api,attendance-sync,auth-routing,class-dates-cache,dates}.test.ts
src/pages/admin/admin-page.test.tsx
src/pages/dashboard/dashboard-page.test.tsx
src/pages/enrollment/enrollment-page.test.tsx
src/test/design-fidelity/design-fidelity.test.ts
```

## Lacunas conhecidas

- **As thresholds de cobertura de 80% em `vitest.config.ts:32-39` são letra morta.** Nenhum portão passa `--coverage`: nem `npm test`, nem o `RUN npx vitest run` do Dockerfile. Registrado como fora de escopo no PRD; ativar isso é outra iniciativa.
- **Sem comparação automática de imagem.** O baseline visual é evidência de revisão humana, por decisão do [ADR-007](adrs/adr-007.md). Regressão visual sutil não é detectada por teste.
- **Sem E2E contra backend real.** Dívida pré-existente, registrada em `docs/qa/automation-backlog/chamada-offline-sync-e2e.md`.
- **`go vet` não roda em portão nenhum**, embora documentado no `README.md`. Pré-existente.
