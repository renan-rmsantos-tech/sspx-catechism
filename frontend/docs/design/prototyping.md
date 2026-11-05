---
target: library
host: vite-app # galeria @compozy/proto compilada pelo vite.config.ts do próprio app
prototypes: "src/**/*.proto.tsx"
entry: "src/drafts/{slug}/index.proto.tsx"
providers: proto.canvas.tsx
dev: npm run proto dev
preview: "http://127.0.0.1:4471/__proto/render/{slug}?chrome=0"
evidence: "npm run proto -- evidence {slug} --state <id>"
output: "docs/design/{slug}/"
---

# Protótipos

A galeria `@compozy/proto` renderiza as views reais do app com fixtures, um estado
por vez, e guarda os comentários de revisão em `proto/review/`. O que se revisa na
galeria é o mesmo código que vai para produção. As skills `proto` e
`proto-apply-comments` (`.agents/skills/`, com links em `.claude/skills/`) descrevem
autoria e revisão.

Tudo roda de dentro de `frontend/`:

```bash
npm run proto dev            # galeria em http://127.0.0.1:4470 (render em :4471)
npm run proto check          # valida meta, guards e compilação; rode antes da revisão
npm run proto -- screenshot dashboard-view --state offline --width 390
```

As capturas vão para `docs/design/<slug>/`, que o `.gitignore` ignora: confira e
descarte, não versione PNG.

## Onde ficam

- **Protótipo de componente**: `<view>.proto.tsx` ao lado da view, com fixtures em
  `<view>.fixtures.ts`. Só compõe a view com props; sem markup próprio. Exemplos:
  `src/components/auth/login-form.proto.tsx` e
  `src/pages/dashboard/dashboard-view.proto.tsx`.
- **Draft**: `src/drafts/<slug>/index.proto.tsx` (`npm run proto -- new <slug> --draft`),
  exploração com markup livre antes de a view existir. Quando a ideia assenta, vira
  view com protótipo de componente e o draft sai.
- **Seções**: cada protótipo declara `spec` no `meta`, e a galeria agrupa por ela:
  `acesso` (Acesso), `catequista` (Área do catequista) e `coordenacao` (Coordenação).
  As seções ficam em `specs` de `proto.config.ts`.
- **Canvas**: `proto.canvas.tsx` carrega `src/styles.css` e um `MemoryRouter`, porque
  as views usam `<Link>`. Não há `Frame`: login, área do catequista e coordenação
  desenham a própria casca dentro da página, então o protótipo já é a tela inteira.

## View e container

As páginas em `src/pages/` e `src/components/auth/` carregam dados, sessão e a fila
offline. Para entrar na galeria, a tela se divide em duas peças:

- a **view** (`DashboardView`, `LoginForm`) recebe tudo por props e só importa
  primitivos de `src/components/ui/` e helpers puros de `src/lib/`;
- o **container** (`DashboardPage`, `LoginPage`) chama a API, o `useAuth()` e o
  IndexedDB e passa o resultado para a view.

O relógio também é prop (`now` no `DashboardView`), para que "dia de aula" e a
saudação não dependam de quando a galeria abre. O chip de rede segue a mesma regra:
`NetworkStatusChip` (`components/ui/chip.tsx`) é puro e `NetworkChip`
(`components/ui/network-chip.tsx`) é a versão ligada ao aparelho; a view recebe o
chip pronto em `networkStatus`.

## Guards

`guards.forbidRuntimeImports` em `proto.config.ts` faz `proto check` falhar com
`network_import` quando um protótipo alcança o cliente de API (`src/lib/api.ts`,
`src/lib/*-api.ts`), a sessão (`src/contexts`), a fila offline e o cache de datas
(`attendance-sync`, `class-dates-cache`, `db`, `dexie`) ou o service worker. A
mensagem mostra a cadeia de imports; a correção é tirar o acesso da view e passar
por props, nunca afrouxar o guard.

O `proto()` no `vite.config.ts` também falha o `vite build` se um `.proto`,
`.fixtures` ou draft chegar ao bundle de produção. No modo `proto-render`, usado pela
galeria, o plugin do PWA fica desligado.
