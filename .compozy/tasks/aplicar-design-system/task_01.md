---
title: "Fase 0 — Fundação: tema, marca/PWA, componentes-âncora e guardas"
status: completed
type: frontend
complexity: high
dependencies: []
---

# Task 1: Fase 0 — Fundação: tema, marca/PWA, componentes-âncora e guardas

## Overview

Estabelece toda a fundação da iniciativa: os tokens do design system viram o tema da aplicação (a paleta âmbar desaparece de uma vez), a marca completa é aplicada (favicon, ícones PWA, manifest, shortcuts), a biblioteca de componentes-âncora é construída no padrão CVA e as guardas de qualidade (teste de cor literal + baseline Playwright) passam a existir. Tudo o mais depende desta task — erro de calibragem aqui contamina as quatro ondas (risco central do ADR-001).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- NÃO importar `design/assets/catequese-ds.css` cru — traduzir (regra do AGENTS.md)
</critical>

<requirements>
- `frontend/src/styles.css` reescrito: tokens DS nativos em `:root` (core six oklch, derivados `color-mix`, tríades warn/danger/info, dourado, tipografia de sistema, escala de tipo, espaçamento, raios, sombras, movimento, `--touch: 44px`, `--nav-w`), alias shadcn derivados (`--primary: var(--accent)`…), `@theme inline` expondo utilities, fallback sRGB via `@supports not (color: oklch(...))` com os hex sancionados (ADR-002)
- Paleta âmbar, referência a Inter e `@custom-variant dark` removidas (Non-Goal: sem tema escuro; DS: sem webfont)
- Foco visível global (2px accent), `prefers-reduced-motion` respeitado, utilitários de tipo `.num`/`.eyebrow`/`.wordmark` disponíveis
- Marca: `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` (área de segurança ~20%), `apple-touch-icon.png` e cópia do `favicon.svg` em `frontend/public/`, derivados de `design/assets/app-icon.svg` (ADR-006); `pwa.svg` provisório removido
- Manifest (`vite.config.ts`): `theme_color`/`background_color` = `#f6f9fb`, ícones novos, shortcuts "Fazer chamada" (`/dashboard`) e "Inscrição" (`/inscricao`); `index.html` com links de favicon/apple-touch e meta `theme-color`
- Componentes-âncora em `frontend/src/components/ui/` no padrão CVA (ADR-003): `button` (reescrito: primary/secondary/ghost/danger, sm/lg/block/icon, `disabledReason`), `chip` + `NetworkChip`, `field`/`input`/`select`/`textarea`, `card` (variantes tight/flush/accent/link), `attendance-row`, `seg`, `choice`, `table`, `metrics` (StatCard/Meter/BarChart à mão, ADR-004), `empty-state`, `stepper`, `sidebar`, `drawer` (sobre `@base-ui/react` Dialog), `brand`
- Guarda de cor literal: teste Vitest que varre `src/**/*.{ts,tsx}` e falha com `#hex`/`rgb(`/`hsl(`/`oklch(` fora de `styles.css`, com allowlist explícita e documentada dos arquivos legados ainda não migrados
- Playwright dev dep + `frontend/scripts/capture-baseline.ts` funcional (viewports 390×844 e 1280×800, saída em `docs/visual-baseline/<onda>/`) (ADR-007)
- Critério de saída da Fase 0: componentes validados lado a lado contra `design/ui_kits/app/components.html`
</requirements>

## Subtasks

- [ ] 1.1 Reescrever o tema em `styles.css` (tokens DS + alias shadcn + `@theme` + fallback sRGB)
- [ ] 1.2 Gerar e commitar os assets de marca; atualizar `index.html` e o manifest do `vite.config.ts`
- [ ] 1.3 Construir o kit de ação/formulário: `button`, `chip`/`NetworkChip`, `field`+controles, `card`
- [ ] 1.4 Construir o kit de dados/superfície: `attendance-row`, `seg`, `choice`, `table`, `metrics`, `empty-state`
- [ ] 1.5 Construir o kit de navegação/overlay: `sidebar`, `drawer`, `stepper`, `brand`
- [ ] 1.6 Criar a guarda de cor literal com allowlist inicial dos arquivos legados
- [ ] 1.7 Instalar Playwright e deixar `capture-baseline.ts` funcional
- [ ] 1.8 Validar todos os componentes lado a lado contra as referências do kit

## Implementation Details

Ver TechSpec §System Architecture (camada de tema, tabela de componentes) e §Core Interfaces (assinaturas). Traduzir tokens de `design/colors_and_type.css` + `design/tokens.css`; comportamento/classes de referência em `design/reference-components/*.jsx` e `design/assets/catequese-ds.css`. O `button.tsx` atual é o molde CVA do stack.

### Relevant Files

- `frontend/src/styles.css` — reescrita do tema (tokens + alias + @theme)
- `frontend/src/components/ui/button.tsx` — reescrito (hex de hover inline sai)
- `frontend/src/components/ui/card.tsx` — ganha variantes
- `frontend/src/components/ui/*.tsx` — ~12 componentes novos
- `frontend/vite.config.ts` — manifest (cores, ícones, shortcuts)
- `frontend/index.html` — favicon, apple-touch, theme-color
- `frontend/public/` — assets de marca derivados
- `frontend/src/test/color-literals.test.ts` — guarda de cor (novo)
- `frontend/scripts/capture-baseline.ts` — script de baseline (novo)

### Dependent Files

- `frontend/src/components/auth/*`, `frontend/src/pages/**` — todas as telas passam a renderizar sobre o tema novo imediatamente (visual "velho sobre tokens novos" é aceitável entre ondas, ADR-001)
- `frontend/src/lib/attendance-sync.ts` — `NetworkChip` consome `getPendingSessionCount` (sem alterar o lib)
- `frontend/src/service-worker.ts` — precache absorve os assets novos (sem alteração)

### Related ADRs

- [ADR-001](adrs/adr-001.md) — fundação + ondas; critério de saída da Fase 0
- [ADR-002](adrs/adr-002.md) — tokens DS nativos + alias shadcn
- [ADR-003](adrs/adr-003.md) — utilities Tailwind + CVA
- [ADR-004](adrs/adr-004.md) — metrics à mão, sem lib de charts
- [ADR-006](adrs/adr-006.md) — ícones pré-gerados
- [ADR-007](adrs/adr-007.md) — Playwright para baseline

## Deliverables

- `styles.css` com o tema DS completo; nenhuma cor âmbar restante no tema
- Assets de marca em `public/` + manifest e `index.html` atualizados
- ~14 componentes-âncora em `components/ui/` com variantes CVA tipadas
- Guarda de cor literal ativa no `npm test` com allowlist documentada
- `capture-baseline.ts` executável
- Unit tests dos componentes com 80%+ coverage **(REQUIRED)**
- Suíte existente permanece verde **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `Button` renderiza `disabledReason` no lugar do label quando desabilitado; variantes aplicam classes de token corretas
  - [ ] `Chip`/`NetworkChip`: variantes ok/warn/danger/info/gold; estado offline e contagem de pendências (mock de `navigator.onLine` + `getPendingSessionCount`)
  - [ ] `Field` exibe label, hint e erro; `AttendanceRow` dispara `onMark` e tem alvo ≥44px
  - [ ] `Meter`/`BarChart`: percentual → dimensão correta; `Stepper` marca etapa atual
  - [ ] Guarda de cor literal: detecta hex plantado em arquivo fora da allowlist e passa com o estado atual da allowlist
- Integration tests:
  - [ ] Suíte existente (`App.test`, `attendance-sync`, páginas) verde sem modificação
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing; coverage >=80% nos componentes novos
- Zero cor literal fora de `styles.css` exceto allowlist documentada
- Componentes visualmente fiéis a `design/ui_kits/app/components.html` (conferência lado a lado registrada)
- App instala como PWA com ícone, cores e shortcuts novos (validado em um Android e um desktop)
- `capture-baseline.ts` gera capturas nos dois viewports
