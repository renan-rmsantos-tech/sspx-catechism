# QA — documentação viva

Árvore viva de QA do **sspx-catechism** (gestão de catequese de uma paróquia: inscrição pública, chamada de presença offline-first, administração). Planejada pelo skill `qa-report`, executada pelo `qa-execution`. Ciclos **acrescentam** aqui — nunca criam árvores paralelas nem trackers por rodada.

## Códigos de área (ids de cenário)

| Código | Área |
|---|---|
| `AUTH` | Autenticação, sessão e ciclo de senha (login, senha provisória, troca forçada) |
| `INS` | Inscrição pública (`/inscricao`) e fila de revisão do coordenador (`/admin/inscricoes`) |
| `CHM` | Chamada de presença do catequista, incluindo offline / fila / sincronização |
| `ADM` | Administração: anos letivos, calendário, turmas, alunos, catequistas |
| `REL` | Relatórios de presença (prévia, PDF, XLSX) |

## Pontos de entrada

- **Dev local:** `http://localhost:5173` (Vite; proxy `/api` → `localhost:8080`)
- **Produção:** `https://catequese.apps.rmsantos.tech`
- **Rotas públicas:** `/login`, `/inscricao`
- **Home por papel:** catequista → `/dashboard`; coordenador/admin → `/admin` (o guard redireciona papel errado)

## Subir o ambiente de QA

Ver "Desenvolvimento local" no `README.md` da raiz. Resumo: Postgres 16 em Docker → `cd backend && go run ./cmd/api` (aplica migrações e semeia o admin de `ADMIN_EMAIL`/`ADMIN_PASSWORD`) → `cd frontend && npm install && npm run dev`.

**A base nasce vazia** (só o admin). Setup mínimo antes de qualquer sessão de chamada:

1. `/admin/anos` — criar ano letivo **ativo**, dias de aula, janela de inscrição
2. `/admin/calendario` — colar as datas de aula (uma por linha)
3. `/admin/catequistas` — criar a catequista (a senha provisória aparece **uma única vez**)
4. `/admin/turmas` — criar turma vinculando a catequista
5. Aluno: via `/admin/alunos` ou aprovando uma inscrição feita em `/inscricao`

## Política de evidência

Padrão do layout: `evidence/` e `state.csv` **gitignorados** (bloco no `.gitignore` da raiz); screenshots só de checkpoints e falhas; os relatórios em `reports/` referenciam evidência por caminho e são o registro durável.

## Adopted from

Não havia árvore de QA anterior (bootstrap em 2026-07-24). Artefatos relacionados ficam onde estão, **indexados** — não migrados:

- `docs/visual-baseline/` — baselines visuais do design system por onda (Playwright com API mockada; **não** é E2E). A onda 2 inclui roteiro manual do fluxo offline: `docs/visual-baseline/onda-2-catequista/README.md`.
- Testes automatizados: `frontend/` Vitest (inclui o guarda de cor literal `src/test/color-literals.test.ts`) · `backend/` Go unit + integração (integração exige `TEST_DATABASE_URL`).
