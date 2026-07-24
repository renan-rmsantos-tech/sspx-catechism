# TechSpec — Aplicar o Design System Catequese

## Executive Summary

A iniciativa traduz o design system "Catequese" (`design/`) para o stack real do frontend — Tailwind v4 (tema via CSS variables + `@theme inline`), shadcn sobre Base UI, React Router 7 — sem tocar backend, dados ou rotas. A arquitetura é uma **camada de tokens DS nativos** como fonte da verdade em `styles.css` (oklch + `color-mix`, com alias shadcn derivados) e uma **biblioteca de componentes-âncora** em `components/ui/` no padrão CVA já usado pelo `button.tsx` atual, adaptada dos `.jsx` de referência. A entrega segue o ADR-001: Fase 0 de fundação (tokens, marca, componentes, guardas) e quatro ondas verticais (auth → catequista → inscrição → admin), cada uma fechando com a checklist do `design/SKILL.md`, capturas de baseline via Playwright e a suíte Vitest verde.

Trade-offs principais: a tradução classe→utility exige conferência visual contra as referências (aceito em troca de um único idioma de estilo no codebase); o calendário da Onda 4 destaca apenas dados existentes — sem fonte de dias santos nesta iniciativa (ADR-005), o dourado litúrgico fica reservado; e o critério "zero cor literal" vira teste automatizado com allowlist decrescente, zerada na Onda 4.

## System Architecture

### Component Overview

**Camada de tema** — `frontend/src/styles.css` (reescrito):

- `:root` com os tokens DS nativos, traduzidos de `design/colors_and_type.css` e `design/tokens.css`: core six (`--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`), derivados via `color-mix` (`--accent-soft/-line/-ink/-press`, `--surface-2/3`, `--fg-soft/-line`), dourado (`--gold/-soft/-ink`), tríades de estado (`--warn`, `--danger`, `--info` + `-soft`/`-ink`), tipografia (stacks de sistema do DS — sem webfont; a referência a Inter sai), escala de tipo, espaçamento, raios, sombras, movimento e layout (`--touch: 44px`, `--nav-w`, `--container`).
- Alias shadcn derivados (`--background: var(--bg)`, `--primary: var(--accent)`, `--destructive: var(--danger)`…) mantêm compatível tudo que fala a convenção shadcn (ADR-002).
- `@theme inline` expõe cores, fontes, raios e sombras como utilities (`bg-accent-soft`, `text-warn-ink`, `font-logo`, `shadow-2`, `min-h-touch`).
- Fallback sRGB (`@supports not (color: oklch(...))`) com os hex sancionados da tabela do DS.
- `@custom-variant dark` removida (Non-Goal do PRD: sem tema escuro).
- Global: foco visível 2px accent, `prefers-reduced-motion` respeitado, `.num`/`.eyebrow`/`.wordmark` como utilitários de tipo.

**Biblioteca de componentes** — `frontend/src/components/ui/`, padrão CVA (ADR-003):

| Componente | Origem na referência | Notas |
|---|---|---|
| `button` | `Button.jsx`, `.btn*` | Reescrito: primary/secondary/ghost/danger, sm/lg/block/icon; `disabledReason` |
| `chip` + `NetworkChip` | `Chip.jsx`, `.chip*` | ok/warn/danger/info/gold/neutral; rede via funções de sync existentes |
| `field`, `input`, `select`, `textarea` | `Field.jsx`, `.field/.input…` | Integra RHF/Zod como hoje |
| `card` | `.card*` | Variantes tight/flush/accent/link sobre o `card.tsx` atual |
| `attendance-row` | `AttendanceRow.jsx` | Alvo ≥44px, marca presente/ausente só com tokens |
| `seg`, `choice` | `.seg*`, `.choice*` | Segmentado e blocos de escolha tocáveis |
| `table` | `.table*` | Wrapper com scroll horizontal próprio |
| `metrics` (`StatCard`, `Meter`, `BarChart`) | `Metrics.jsx` | CSS/SVG à mão, sem lib (ADR-004) |
| `empty-state` | DS §voz | Título + próximo passo (ação) |
| `stepper` | `shell-*` | Indicador de etapas da inscrição |
| `sidebar` | `Sidebar.jsx` | Grupos + `NavLink` + selo de pendências |
| `drawer` | `ReviewDrawer.jsx` | Comportamento via `@base-ui/react` Dialog; `ReviewDrawer` da Onda 4 é composição |
| `brand` | `design/assets/*.svg` | Brasão + wordmark (única serifa do produto) |

**Áreas da aplicação** — rotas e papéis inalterados (`/login`, `/trocar-senha`, `/inscricao`, `/dashboard`, `/dashboard/turmas/:id/chamada`, `/admin/*`). O `admin-page.tsx` (1075 linhas, 7 views inline) é fatiado em `pages/admin/views/*.tsx` na Onda 4. A inscrição vira stepper na mesma rota com o mesmo payload.

**Offline e PWA** — `lib/db.ts` (Dexie v1), `lib/attendance-sync.ts` e `src/service-worker.ts` intocados; a UI nova consome as funções existentes (`getPendingSessionCount`, `syncPendingSessions`…) para o chip de rede e a fila visível. Manifest e `index.html` ganham a marca nova (ADR-006).

## Implementation Design

### Core Interfaces

Todos os componentes seguem: props tipadas + CVA variants + `className` passthrough via `cn()`; sem estado de dados interno — dados e callbacks vêm das páginas, fetch fica em `lib/*-api.ts`, como hoje.

```tsx
// button.tsx — um primary por tela; desabilitado explica o motivo
type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    disabledReason?: string // ex.: "Faltam 4" no lugar do label, quando disabled
  }

// attendance-row.tsx — linha de chamada
type AttendanceRowProps = {
  student: { id: string; name: string }
  mark: boolean | null
  onMark: (present: boolean) => void
}

// metrics.tsx
type BarChartProps = { data: { label: string; value: number }[]; max?: number }
```

- `Field`: composição `<Field label hint error>` envolvendo controle; erro vem do Zod via RHF.
- `Drawer`: `<Drawer open onOpenChange>` com header/body/footer sobre Base UI Dialog.
- `Stepper`: `<Stepper steps current>` (apresentação); o estado de etapa vive no `enrollment-page` com um único form RHF, validando por etapa com `schema.pick(...)` e submetendo o payload completo no final.
- `Sidebar`: grupos de navegação com `NavLink`; selo de pendências recebe a contagem por prop.
- `NetworkChip`: `navigator.onLine` + eventos `online/offline` + `getPendingSessionCount()`; sem estado global novo.

### Data Models

**Nenhum modelo novo ou alterado.** IndexedDB (Dexie, `pending_sessions` + `cached_class_dates`, versão 1) e todos os tipos de `lib/attendance-types.ts` e `types/auth.ts` permanecem. A validação Zod da inscrição é reorganizada em sub-schemas por etapa (`pick`), preservando o schema completo de submissão.

### API Endpoints

**Nenhum endpoint criado ou alterado** (Non-Goal do PRD). Consumo das superfícies novas sobre o que já existe:

| Superfície (onda) | Endpoint existente |
|---|---|
| Calendário — datas de aula + hoje (O4) | `GET /api/class-dates` |
| Relatórios — barras e stat-cards (O4) | `GET /api/reports/attendance` |
| Selo de pendências na sidebar (O4) | `GET /api/enrollments` (contagem de pendentes) |
| Drawer de revisão — aprovar/rejeitar (O4) | `POST /api/enrollments/{id}/approve` / `.../reject` |
| Stepper de inscrição (O3) | `POST /api/enrollments` (payload idêntico) |
| Chamada + sync (O2) | `POST /api/attendance` / `GET /api/attendance` |

O calendário não recebe fonte de dias santos nesta iniciativa (ADR-005); o componente nasce com slot de destaque por data (chip `gold`) para a iniciativa futura só fornecer dados.

## Integration Points

Sem serviços externos novos; pontos de plataforma:

- **Manifest PWA** (`vite.config.ts`): `theme_color` e `background_color` = `#f6f9fb` (hex sancionado de `--bg` — manifest não parseia oklch); `shortcuts` "Fazer chamada" (`/dashboard`) e "Inscrição" (`/inscricao`); ícones apontando para os PNGs pré-gerados.
- **Assets de marca**: fonte em `design/assets/*.svg`; derivados commitados em `frontend/public/` (`favicon.svg`, `apple-touch-icon.png` 180, `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` com área de segurança ~20%). Artefatos derivados — regenerar do SVG, nunca editar (ADR-006).
- **`index.html`**: links de favicon/apple-touch, meta `theme-color`; zero webfont (stacks de sistema — decisão do DS para custo de rede nulo).
- **Service worker**: sem mudança; `globPatterns` já precacheia `png,svg`.
- **Deploy (Caddy/Traefik)**: nenhum ajuste — assets estáticos no mesmo build da SPA.

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `src/styles.css` | modified | Reescrita total do tema (tokens DS + alias). Risco médio: alias esquecido quebra cor de componente shadcn | Conferência visual global na Fase 0; guarda de cor literal |
| `components/ui/button.tsx` | modified | Reescrito em variants DS; hex de hover inline sai. Risco baixo | Testes de componente |
| `components/ui/*` (novos) | new | ~13 componentes-âncora. Risco: deriva visual vs referência | Validação lado a lado com `components.html` antes da Onda 1 |
| `components/auth/*` | modified | Shell full-ink + páginas migradas (Onda 1). Risco baixo | Fluxos de login/troca testados |
| `pages/dashboard/*` | modified | Dashboard + chamada (Onda 2). Risco alto: é o coração offline do produto | Suíte `attendance-sync` intacta e verde; teste manual offline |
| `pages/enrollment/*` | modified | Form único → stepper (Onda 3). Risco médio: payload precisa permanecer idêntico | Teste de submissão comparando payload |
| `pages/admin/admin-page.tsx` | modified | Fatiado em `views/*` + sidebar/drawer/calendário/relatórios (Onda 4). Risco médio: refactor grande | Fatiar sem mudar comportamento antes de re-estilizar |
| `vite.config.ts` + `public/` | modified | Manifest, ícones, shortcuts. Risco baixo | Validar instalação PWA em Android + desktop |
| `service-worker.ts`, `lib/db.ts`, `lib/attendance-sync.ts` | unchanged | Intocados por decisão | Guardas: testes existentes seguem verdes |

## Testing Approach

### Unit Tests

- **Componentes-âncora** (Vitest + Testing Library, já configurados): contrato de cada componente — `Button` renderiza `disabledReason` quando disabled; `Chip`/`NetworkChip` variantes e estados de rede (mock de `navigator.onLine`); `AttendanceRow` dispara `onMark`; `Stepper` só avança com etapa válida; `Field` exibe erro Zod; `Meter`/`BarChart` percentual → dimensão.
- **Guarda de cor literal**: teste Vitest que varre `src/**/*.{ts,tsx}` e falha ao encontrar `#hex`/`rgb(`/`hsl(`/`oklch(` fora de `styles.css`. Nasce com allowlist explícita dos arquivos legados não migrados; cada onda a encolhe; zera na Onda 4. Roda no `npm test` (CI existente).
- **Paridade**: os testes existentes (`attendance-sync.test.ts`, `api.test.ts`, testes de página) não são alterados e devem permanecer verdes após cada onda.

### Integration Tests

- **Baseline visual (Playwright, ADR-007)**: `scripts/capture-baseline.ts` com viewports fixos (390×844, 1280×800), login com credencial de dev, capturas em `docs/visual-baseline/<onda>/`; rodado manualmente no fechamento de cada onda contra o stack local; telas do catequista capturadas também com offline simulado (`context.setOffline`). Fora do CI.
- **Gates manuais por onda**: checklist do `design/SKILL.md` por tela; conferência lado a lado com `design/ui_kits/app/*.html`; na Onda 2, fluxo offline completo (marcar sem rede → fila visível → sincronizar ao voltar); na Onda 4, aprovar/rejeitar inscrição de ponta a ponta pelo drawer.

## Development Sequencing

### Build Order

1. **Fase 0 — Fundação** (sem dependências):
   1. `styles.css`: tokens DS + alias shadcn + `@theme` + fallback sRGB; âmbar e variante dark removidos.
   2. Marca: PNGs gerados e commitados; `index.html` e manifest atualizados (cores, ícones, shortcuts).
   3. Componentes-âncora + testes, validados contra `components.html`.
   4. Guarda de cor literal com allowlist inicial documentada.
   5. Playwright + `capture-baseline.ts` funcionando.
2. **Onda 1 — Auth** (depende da Fase 0): `auth-shell` full-ink (`shell-auth.html`), `login-page`, `change-password-page`, regras de senha ao vivo. Piloto da fundação.
3. **Onda 2 — Catequista**: `dashboard-page` (cartões, medidores, NetworkChip) e `attendance-page` (AttendanceRow, busca, marcar-todos, trilho, "Faltam N", fila de sync). Remove o verde/vermelho inline da allowlist.
4. **Onda 3 — Inscrição**: `enrollment-page` → stepper + blocos de escolha; payload inalterado.
5. **Onda 4 — Admin**: fatiar `admin-page.tsx` em `views/` (sem mudar comportamento), depois Sidebar com pendências, tabelas, ReviewDrawer, calendário, relatórios. Allowlist zera.

Cada onda fecha com: checklist `SKILL.md` + capturas de baseline + suíte verde.

### Technical Dependencies

- Nenhuma dependência externa bloqueante. Novas dependências dev: `@playwright/test`. Nenhuma dependência de produção nova.
- Ferramenta local pontual para rasterizar os SVGs (ex.: `rsvg-convert`), usada uma vez na Fase 0.

## Monitoring and Observability

Iniciativa de UI sem telemetria própria (não há stack de observabilidade frontend no projeto — fora de escopo introduzi-la). A visibilidade operacional é a que o produto já dá ao usuário por design: chip de rede, fila de sincronização com contagem, e os logs existentes do backend para os endpoints consumidos.

## Technical Considerations

### Key Decisions

- **Tokens DS nativos + alias shadcn** (ADR-002) — vocabulário do DS como fonte da verdade; rejeitado manter nomes shadcn como primários (tradução mental constante, risco de deriva).
- **Utilities Tailwind + CVA** (ADR-003) — um idioma de estilo, tipado; rejeitado CSS de componente portado (dois idiomas, fronteira ambígua com a proibição do `AGENTS.md`).
- **Gráficos à mão** (ADR-004) — CSS/SVG sobre tokens; rejeitada lib de charts (bundle + theming vs tokens, YAGNI).
- **Calendário só com dados existentes** (ADR-005) — sem fonte de dias santos nesta iniciativa; rejeitados módulo estático (lista litúrgica não validada) e endpoint novo (viola Non-Goal).
- **Ícones pré-gerados** (ADR-006) — PNGs versionados; rejeitada geração no build (dependência pesada para evento raro).
- **Playwright para baseline, fora do CI** (ADR-007) — capturas reproduzíveis; rejeitada captura manual (inconsistente, não reexecutável).

### Known Risks

- **Deriva visual na tradução classe→utility** (probabilidade média): mitigada pela validação lado a lado na Fase 0 (gate de saída) e pela Onda 1 como piloto pequeno.
- **Regressão do offline na Onda 2** (probabilidade baixa, impacto alto): mitigada por não tocar `db.ts`/`attendance-sync.ts`/`service-worker.ts` e exigir a suíte de sync verde + teste manual offline no fechamento.
- **Refactor do admin monolítico** (probabilidade média): mitigado fatiando primeiro sem mudança de comportamento (commit separado), re-estilizando depois.
- **Stepper alterar o payload da inscrição** (probabilidade baixa): mitigado por teste que compara o payload submetido com o formato atual.
- **Maskable mal enquadrado no Android**: validar com preview de maskable antes do commit (ADR-006).

## Architecture Decision Records

- [ADR-001: Aplicar o design system via fundação + ondas verticais](adrs/adr-001.md) — Fase 0 de tokens/marca/componentes seguida de quatro ondas verticais por área.
- [ADR-002: Tokens DS nativos como fonte da verdade, com alias shadcn](adrs/adr-002.md) — vocabulário do DS em `:root`/`@theme`; variáveis shadcn viram alias derivados.
- [ADR-003: Componentes-âncora com utilities Tailwind + CVA](adrs/adr-003.md) — um idioma de estilo, no molde do `button.tsx` atual.
- [ADR-004: Gráficos de relatórios à mão (CSS/SVG), sem lib](adrs/adr-004.md) — barras e medidores próprios sobre tokens.
- [ADR-005: Calendário destaca apenas dados existentes](adrs/adr-005.md) — sem fonte de dias santos nesta iniciativa; dourado reservado, componente com slot pronto.
- [ADR-006: Ícones PWA pré-gerados e versionados](adrs/adr-006.md) — PNGs derivados dos SVGs da marca, commitados em `public/`.
- [ADR-007: Playwright para baseline visual, fora do CI](adrs/adr-007.md) — capturas reproduzíveis por onda em `docs/visual-baseline/`.
