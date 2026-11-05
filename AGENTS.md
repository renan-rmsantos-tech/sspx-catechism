# Agent guidelines

Stack ativa: **Go** (`backend/`) + **Vite/React** (`frontend/`) + **PostgreSQL** em Docker num droplet DigitalOcean.

- Backend: chi, pgx, sqlc, goose — ver `backend/`
- Frontend: React Router, Tailwind, shadcn/ui — ver `frontend/`
- Deploy: `compose.traefik.yaml` (Caddy serve a SPA + proxy `/api`, atrás do Traefik compartilhado na DigitalOcean); CI em `.github/workflows/deploy.yml`. Runbook em `infra/README.md`
- Backup: `scripts/backup.sh`/`restore.sh` → DigitalOcean Spaces (S3)
- Planejamento histórico da migração: `.compozy/tasks/migration-go/`

## Design system — Catequese

Toda UI do `frontend/` segue o design system em `design/`. Leia antes de mexer em tela:

- **`design/DESIGN.md`** — o sistema completo (cor, tipografia, espaço, layout, componentes, movimento, voz, anti-padrões). É a fonte da verdade visual.
- **`design/SKILL.md`** — como construir uma tela nova, com checklist no fim.
- **`design/assets/catequese-ds.css`** — a folha de referência: tokens `:root` + todos os componentes, já implementados.
- **`design/reference-components/*.jsx`** — os primitivos de referência (Button, Chip, AttendanceRow, Field, Sidebar, ReviewDrawer, Metrics).

**Como aplicar neste stack (Tailwind + shadcn/ui):** NÃO importe `catequese-ds.css` cru. Traduza os tokens `oklch` do `:root` (em `design/colors_and_type.css` e `design/tokens.css`) para o `theme` do `tailwind.config` e para as CSS variables do shadcn, e adapte os `.jsx` de referência para os componentes `.tsx` do projeto. Os `.jsx` mostram o comportamento e as classes; a implementação final é TypeScript + shadcn.

**Regras inegociáveis** (detalhe em `DESIGN.md` §9):

1. **Nenhuma cor literal fora dos tokens.** Nada de hex solto num componente — derive dos tokens. Esse era o defeito do código antigo (verde/vermelho inline).
2. **Um único teal** = ação primária E presença. Dourado é sinal litúrgico, nunca botão.
3. **A serifa é só da marca** (`--font-logo` / `.wordmark`). Nunca num título.
4. **Um `btn-primary` por tela**, e botão desabilitado diz o motivo (`Faltam 4`, não um cinza mudo).
5. **44px de alvo de toque** em qualquer superfície de catequista.
6. **Todo número comparável é mono tabular** (`.num`).
7. **Offline é visível:** chip de rede permanente, fila com ação de sincronizar.

Ao criar/refazer tela, rode a checklist do fim do `SKILL.md` e conserte o que falhar.

## Protótipos — `@compozy/proto`

Telas novas ou refeitas passam pela galeria antes de virar rota: ela renderiza a view real com fixtures, um estado por vez, e guarda os comentários de revisão em `frontend/proto/review/`. Fluxo completo em **`frontend/docs/design/prototyping.md`**; autoria e revisão nas skills `proto` e `proto-apply-comments` (`.agents/skills/`).

- Rode de `frontend/`: `npm run proto dev` (galeria em `127.0.0.1:4470`) e `npm run proto check` (precisa sair com `problems` vazio).
- Protótipo de componente: `<view>.proto.tsx` ao lado da view, fixtures em `<view>.fixtures.ts`, sem markup próprio. Exploração livre vai em `src/drafts/<slug>/index.proto.tsx`.
- A view recebe tudo por props; quem chama API, `useAuth()` ou o IndexedDB é o container da página (`DashboardView`/`DashboardPage`, `LoginForm`/`LoginPage`). Falta algo para um estado? Adicione uma prop à view.
- `network_import` no `proto check` quer dizer que a view alcança dados: corte o import, nunca afrouxe `guards.forbidRuntimeImports`.
- Capturas (`npm run proto -- screenshot <slug> --state <id>`) caem em `frontend/docs/design/<slug>/`, ignorado pelo git. Agentes não aprovam revisões nem editam `proto/review/` à mão.
