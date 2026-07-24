# TechSpec — Aplicar o Design System Catequese

## Executive Summary

Iniciativa **100% frontend** (`frontend/`): traduzir o design system em `design/` para o stack Tailwind v4 + shadcn/base-nova + Base UI, em uma fase de fundação e quatro ondas verticais (ADR-001). As decisões estruturais: tokens em **duas camadas** no `styles.css` — os tokens do DS prefixados `--ds-*` como fonte da verdade e os aliases shadcn (`--primary`, `--background`…) apontando para eles, o que re-skina todas as telas existentes no ato (ADR-002); os 7 reference-components do DS **portados para `.tsx`** como biblioteca própria com regras do design codificadas nos tipos (ADR-003); o destaque litúrgico do calendário **adiado** — a Onda 4 usa só os dias de aula que já existem na API (ADR-004); e verificação por **Playwright com API mockada** — e2e dos fluxos críticos (incluindo chamada offline em navegador real), screenshots commitados como baseline visual e gate de CI que falha em cor literal fora dos tokens (ADR-005).

Trade-offs principais: manutenção própria da biblioteca de componentes em troca de fidelidade por construção às regras do DS; uma indireção a mais na cadeia de tokens em troca de auditabilidade linha a linha contra `design/colors_and_type.css`; e2e sem backend real em troca de CI leve e determinístico — aceitável porque nenhum contrato de API muda (non-goal do PRD).

## System Architecture

### Component Overview

Quatro camadas novas/reescritas em `frontend/`, sobre a infraestrutura existente (roteamento, auth, Dexie/Background Sync e deploy **intocados**):

1. **Tokens** — `src/styles.css` reescrito (ADR-002): `:root` com camada `--ds-*` (oklch + `color-mix()` + fallback sRGB via `@supports`) e camada de aliases shadcn; `@theme inline` expõe utilities existentes + exclusivos do DS (`gold`, `warn`, `info`, `-soft`/`-ink`, `accent-press`), stacks de fonte de sistema (zero webfont; a menção a `Inter` sai) e raios 8/12/16/22px. Espaço usa a escala padrão do Tailwind; alvo de 44px = `min-h-11`.
2. **Componentes** (`src/components/ui/`, ADR-003) — Button (+`ConfirmAttendanceButton`), Chip (+`NetworkChip`, `AttendanceChip`), família Field (`TextField`, `SelectField`, `TextAreaField`, `ChoiceGroup`, `SearchField`), `AttendanceRow` (+`tallyMarks`), Metrics (`Stat`, `StatTile`, `Meter`, `Bars`, `ProgressRail` — CSS puro, sem lib de gráficos), `ReviewDrawer` (+`Facts`, `isRejectionValid`; sobre Base UI Dialog não-modal), `Sidebar`. Substituem `button.tsx`/`card.tsx` atuais e os componentes locais duplicados (`Field`/`DataTable`/`Banner` inline do `admin-page.tsx`, `Field` do `enrollment-page.tsx`).
3. **Shells** (`src/components/layout/`) — `AuthShell` (split full-ink com painel institucional), `CatechistShell` (appbar com `NetworkChip` + actionbar), `AdminShell` (sidebar 244px com selo de pendências; faixa horizontal a 1024px). Substituem o chrome inline de cada página.
4. **Marca/PWA** — SVGs de `design/assets` + `design/build` copiados para `public/`; PNGs (192/512/maskable/apple-touch-180) gerados por script one-off e commitados; manifest do `vite-plugin-pwa` atualizado a partir de `design/build/manifest.webmanifest`; `index.html` ganha favicon, apple-touch-icon e theme-color.

Fluxo de dados: telas → hooks (`useNetworkStatus`, `usePendingSync` em `src/hooks/`, envelopando `attendance-sync.ts` existente) e funções puras de view-model (`report-stats.ts`, `calendar-grid.ts`) → `apiFetch`/`admin-api.ts` existentes. Nenhuma interação externa nova.

## Implementation Design

### Core Interfaces

Regra do DS no sistema de tipos — botão desabilitado exige motivo:

```tsx
type ButtonBase = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
} & React.ComponentProps<typeof BaseButton>

type ButtonProps =
  | (ButtonBase & { disabled?: false; disabledLabel?: never })
  | (ButtonBase & { disabled: true; disabledLabel: string })

export function Button(props: ButtonProps): React.JSX.Element

export function ConfirmAttendanceButton({ remaining }: { remaining: number })
// remaining > 0 → disabled, rótulo "Faltam N"; remaining === 0 → "Confirmar chamada"
```

Chamada — `null` é estado real, visível e contável:

```tsx
export interface AttendanceRowProps {
  name: string
  meta?: string
  mark: boolean | null
  onMark: (mark: boolean) => void
}

export function tallyMarks(marks: Array<boolean | null>): {
  present: number; absent: number; unmarked: number
}
```

Campos — `aria-invalid` é o único hook de estilo de erro (visual e a11y não divergem); chips carregam estado em `-soft`/`-ink`:

```tsx
export interface FieldProps {
  label: string
  error?: string          // liga aria-invalid + mensagem; CSS estiliza por [aria-invalid]
  hint?: string
}

export type ChipTone = 'ok' | 'warn' | 'danger' | 'info' | 'gold' | 'neutral'
export function NetworkChip({ online }: { online: boolean })

export function isRejectionValid(reason: string): boolean  // exportado do ReviewDrawer
```

Convenção de erro: componentes não tratam erro de rede — telas continuam usando o `ApiError` de `src/lib/api.ts`; componentes apenas exibem o que recebem via props.

### Data Models

**Nenhuma mudança persistida** — banco, tabelas Dexie (`pending_sessions`, `cached_class_dates`) e DTOs intactos. Modelos novos são view-models client-side, funções puras testáveis:

- **Stepper de inscrição** (`src/pages/enrollment/steps.ts`): `EnrollmentStep[]` — `{ id, title, fields }` com schema zod fatiado do schema atual por etapa; o payload de `POST /api/enrollments` permanece byte a byte o de hoje. Estado do stepper local (react-hook-form valida por etapa).
- **Estatísticas de relatório** (`src/lib/report-stats.ts`): `ClassAttendanceStats` / `StudentAttendanceStats` derivados de `GET /api/attendance` — extração tipada da técnica que `dashboard-page.tsx:83-91` já usa.
- **Grade de calendário** (`src/lib/calendar-grid.ts`): `buildCalendarGrid(year, dates, lockedDates, highlights?: IsoDate[])` — `highlights` nasce vazio (dourado adiado, ADR-004) para a assinatura não mudar no futuro.
- **Selo de pendências**: contagem de `GET /api/enrollments?status=pending` consumida pelo `AdminShell`.

### API Endpoints

**Nenhum endpoint novo, nenhum contrato alterado.** Consumo por superfície:

| Superfície | Endpoint | Observação |
|---|---|---|
| Drawer de revisão | `GET /api/enrollments?status&q` · `POST /api/enrollments/{id}/approve` `{classId, existingStudentId?}` · `POST /api/enrollments/{id}/reject` `{rejectionReason}` | DTO já devolve 22 campos; a tela atual exibe 8 — o drawer organiza todos (1ª comunhão, crisma, contatos, `createdAt`) sem tocar o backend |
| Calendário | `GET /api/class-dates?academicYearId` · `PUT /api/class-dates` | leitura da grade + edição pela coordenação (fluxo atual) |
| Relatórios | `GET /api/attendance?classId&from&to` · `GET /api/reports/attendance?format=pdf\|xlsx` | gráficos client-side; downloads continuam no endpoint existente |
| Chamada | `POST /api/attendance` | via fila Dexie, intocado |
| Inscrição pública | `POST /api/enrollments` | payload idêntico ao atual (paridade testada) |

## Integration Points

- **PWA/manifest** — fonte: `design/build/manifest.webmanifest` (`theme_color #005740`, `background_color #f6f9fb`, shortcuts "Fazer chamada" → `/dashboard` e "Inscrição" → `/inscricao`) aplicado ao manifest do `vite-plugin-pwa` em `vite.config.ts`. `index.html` ganha `<link rel="icon">` (SVG + PNG fallback), `apple-touch-icon` (iOS não aceita SVG) e `<meta name="theme-color">`. PNGs gerados por `scripts/generate-icons.mjs` (sharp, devDependency) uma vez e commitados — sem rasterização no build.
- **Pilha offline** — `NetworkChip` e banner de fila consomem `attendance-sync.ts` via `useNetworkStatus`/`usePendingSync`; service worker e Dexie intocados. Higiene: declarar `workbox-precaching` em `package.json` (hoje só transitiva de `vite-plugin-pwa` — risco de build).
- **Base UI** — `Dialog` para o ReviewDrawer (Esc + scrim + foco); demais componentes sem primitive. `components.json` preservado sem instalar componentes shadcn.
- **Fontes** — nenhuma: stacks de sistema do DS (decisão explícita do design).
- **CI** — `deploy.yml`, job `test`: + passo Playwright (chromium only, API mockada — sem backend/Postgres no CI) e `npm run test:coverage` no lugar de `npx vitest run`.
- **Deploy** — Caddy/Traefik/compose intocados (SPA estática).

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `frontend/src/styles.css` | modified (reescrito) | Troca total da paleta; risco médio — re-skina todas as telas de uma vez | Conferir contra `design/colors_and_type.css` linha a linha; gate de cor literal |
| `frontend/src/components/ui/*` | new/deprecated | `button.tsx`/`card.tsx` substituídos; 7+ componentes novos; risco baixo (cobertos por testes) | Portar com testes; conferir contra `components.html` |
| `frontend/src/components/layout/*` | new | 3 shells substituem chrome inline; risco baixo | Migrar página a página dentro da onda da área |
| `frontend/src/pages/admin/admin-page.tsx` | modified (fatiado) | 1075 linhas → arquivo por módulo; risco médio (testes de 361 linhas acompanham) | Fatiar na Onda 4 junto com o redesign |
| `frontend/src/pages/dashboard/*` | modified | Re-skin + hooks de rede; o verde/vermelho inline (`attendance-page.tsx:183-198`) morre; risco médio (fluxo offline) | e2e offline antes de fechar a Onda 2 |
| `frontend/src/pages/enrollment/*` | modified | Formulário único → stepper; risco médio (paridade de payload) | Teste de paridade byte a byte |
| `frontend/vite.config.ts` + `index.html` + `public/` | modified | Manifest, ícones, meta tags; risco baixo | Validar instalação PWA em Android + desktop |
| `.github/workflows/deploy.yml` | modified | + Playwright + coverage; risco baixo (CI mais lento) | Chromium only; cache de browsers |
| `frontend/package.json` | modified | + `@playwright/test`, `sharp` (dev), `workbox-precaching` declarado | — |
| Backend (`backend/`) | none | Zero mudança | — |

## Testing Approach

### Unit Tests

- **Vitest + RTL (thresholds 80% mantidos e passando a valer no CI).** Um teste por regra do DS: `disabledLabel` obrigatório (tipo + runtime), `ConfirmAttendanceButton` ("Faltam N" / "Confirmar chamada"), tones do Chip, `tallyMarks` com `null` contável, `aria-invalid` ligando erro visual+a11y, `isRejectionValid`, `buildCalendarGrid`, `report-stats`, schemas zod por etapa do stepper.
- **Gate de conformidade** como teste Vitest: varredura de `src/` que falha em cor literal (hex/rgb/oklch, `bg-[#…]`, `style` com cor) fora de `styles.css` — métrica nº 1 do PRD como gate automático desde a Fase 0.
- Mocks: fixtures tipadas com os tipos de `src/types/`; `fake-indexeddb` continua para a fila Dexie.
- Testes de página existentes atualizados onda a onda (`admin-page.test.tsx` fatiado junto com a página).

### Integration Tests

- **Playwright (chromium, API mockada via `page.route`, webServer `vite preview`)** — um spec por fluxo crítico: login com redirecionamento por papel; troca de senha com regras ao vivo; **chamada offline de ponta a ponta** (`context.setOffline(true)` → marcar → fila visível → online → assert do `POST /api/attendance`); inscrição por etapas com payload conferido no mock; aprovar/rejeitar (com motivo) pelo drawer.
- **Baseline visual**: `toHaveScreenshot` por tela; snapshots do Linux/CI commitados em `frontend/e2e/__screenshots__/`, adicionados no fechamento de cada onda.
- Conferência manual da checklist do `design/SKILL.md` por tela permanece critério de saída de onda.

## Development Sequencing

### Build Order

1. **Fase 0 — Fundação** (bloqueia tudo): `styles.css` em duas camadas (re-skin automático das telas); 7 componentes-âncora portados com testes, conferidos contra `design/ui_kits/app/components.html`; marca completa (script de ícones, `public/`, manifest, `index.html`); infra Playwright + gate de cor literal no CI; `workbox-precaching` declarado.
2. **Onda 1 — Autenticação** (piloto): `AuthShell`, login, troca de senha com regras ao vivo; e2e + screenshots.
3. **Onda 2 — Catequista**: `CatechistShell` + hooks de rede/fila; dashboard (cards, `Meter`, `NetworkChip`); folha de chamada (`AttendanceRow`, busca, marcar-todos, `ProgressRail`, `ConfirmAttendanceButton`, banner de sync); e2e da chamada offline.
4. **Onda 3 — Inscrição**: stepper + `ChoiceGroup`; teste de paridade do payload; e2e de envio.
5. **Onda 4 — Admin** (a maior): `AdminShell` com selo de pendências; fatiamento do `admin-page.tsx` por módulo; tabelas padronizadas; drawer de revisão; grade de calendário (só dias de aula, ADR-004); relatórios com `Bars`/`StatTile`; e2e aprovar/rejeitar; screenshots finais.

Ondas estritamente sequenciais (ADR-001); cada uma fecha com checklist do `SKILL.md` + screenshots no baseline.

### Technical Dependencies

- Nenhuma dependência externa nova além de devDependencies (`@playwright/test`, `sharp`).
- Nenhuma entrega de terceiros; nenhum requisito de infraestrutura (deploy inalterado).
- Única dependência interna: Fase 0 fecha antes de qualquer onda abrir (componentes conferidos contra referência).

## Monitoring and Observability

Não se aplica em novos sistemas — iniciativa de interface sem serviços novos. Permanecem os mecanismos existentes: logs do backend inalterados, e a visibilidade operacional relevante ao usuário é a própria regra do DS ("offline visível": `NetworkChip` permanente + fila de sincronização com contagem, alimentados por `getPendingSessionCount`). O CI passa a expor dois sinais novos de qualidade: falha por cor literal e diffs de screenshot em PR.

## Technical Considerations

### Key Decisions

- **Tokens em duas camadas** (`--ds-*` + aliases shadcn) — auditável contra o DS e re-skin automático; abre mão de um vocabulário único. Rejeitados: só nomes DS (reescrita cara), só nomes shadcn (perde rastreabilidade). Detalhe em ADR-002.
- **Portar reference-components como biblioteca própria** — fidelidade por construção, regras nos tipos; abre mão de upstream de manutenção. Rejeitados: shadcn+restyle, híbrido. Detalhe em ADR-003.
- **Dourado litúrgico adiado** — calendário com dados existentes; entrega menos que o design desenha, deliberadamente. Rejeitados: lista estática (decisão pastoral prematura), backend CRUD (viola non-goal). Detalhe em ADR-004.
- **Playwright mockado + screenshots commitados** — paridade offline testada em navegador real e baseline reproduzível; abre mão de e2e full-stack. Detalhe em ADR-005.
- **Gráficos em CSS puro** (`Bars`/`Meter` da referência) — nenhuma lib de gráficos entra; o design não pede nada além de barras preenchidas com `role="img"`.

### Known Risks

- **Deriva visual na tradução JSX→TSX/Tailwind** (probabilidade média): mitigada por conferência lado a lado contra os HTMLs de referência como critério de saída da Fase 0 e screenshots como trava a partir daí.
- **Flakiness de screenshot** (baixa): chromium fixo no CI, fontes de sistema (sem webfont — rendering estável), tolerância de antialiasing.
- **Estado misto entre ondas** (certa, aceita): telas não migradas exibem "layout velho sobre paleta nova" até a sua onda — sem usuários, sem custo (ADR-001).
- **Fatiamento do admin regride comportamento** (média): os testes existentes de 361 linhas migram junto e o e2e de aprovar/rejeitar cobre o fluxo mais crítico.

## Architecture Decision Records

- [ADR-001: Aplicar o design system via fundação + ondas verticais](adrs/adr-001.md) — Fase 0 de tokens/marca/componentes seguida de quatro ondas verticais por área.
- [ADR-002: Tokens em duas camadas — `--ds-*` como fonte, aliases shadcn por cima](adrs/adr-002.md) — DS como fonte da verdade em `:root`, aliases shadcn re-skinam as telas existentes automaticamente.
- [ADR-003: Portar os reference-components do DS como componentes próprios em TypeScript](adrs/adr-003.md) — os 7 `.jsx` viram `.tsx` com regras do design codificadas nos tipos; sem componentes shadcn de prateleira, sem lib de gráficos.
- [ADR-004: Adiar o destaque litúrgico — calendário da Onda 4 só com dias de aula](adrs/adr-004.md) — grade sobre `/api/class-dates` existente; dourado litúrgico fica para iniciativa futura com `highlights?` já previsto na assinatura.
- [ADR-005: Playwright com API mockada — e2e dos fluxos críticos + screenshots como baseline visual](adrs/adr-005.md) — chamada offline testada em navegador real, baseline em `frontend/e2e/__screenshots__/`, gate de cor literal e coverage aplicados no CI.
