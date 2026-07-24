---
name: catequese-design-system
description: Build UI in the Catequese design system — a calm, phone-first, offline-honest parish catechism manager. Cool near-white canvas, one teal that means both action and present, liturgical gold rationed to the calendar, a single serif reserved for the coat of arms, and 44px touch targets throughout. Use for any screen, component or artifact in the SSPX catechism product, or when asked to design in this system.
user-invocable: true
---

# Building in the Catequese design system

Read [`DESIGN.md`](DESIGN.md) for the full rationale. This file is what to *do*.

---

## What is inside

| Path | What it gives you |
|---|---|
| `assets/catequese-ds.css` | **The complete source stylesheet** — tokens plus every component. Link this and you need nothing else. |
| `colors_and_type.css` | Portable colour + type foundations: the core six, accent/gold/state derivatives, four font stacks, the type scale, the type role classes, and an sRGB fallback block. |
| `tokens.css` | Portable radius, spacing, elevation, layout widths, motion durations, the 44px touch floor, focus ring, reduced-motion guard. |
| `DESIGN.md` | The system in ten sections, with the reasoning behind each rule. |
| `preview/` | Ten focused review cards. `preview/index.html` is the launcher. |
| `ui_kits/app/` | Six applied surfaces — attendance sheet, catechist dashboard, admin console, auth, component reference — all interactive. |
| `assets/` + `build/` | Coat of arms (light/dark), favicon, PWA icon, runtime icon set, web app manifest. |
| Root `*.html` | Ten preserved source screens, working and unmodified. |
| `context/provenance.md` | Which source file each rule came from, plus known drift and declared gaps. |

## Source context

Extracted from the Open Design project **Catechism** (`da2f6d22-b8b8-4038-9e5f-ad6f163d3220`),
linked to `~/Projects/rmtech/sspx-catechism`.

The product is parish catechism management for a traditional-rite (SSPX) parish, serving two
audiences that share almost nothing: **volunteer catechists** taking attendance on a phone,
standing up in a parish hall, often with no signal — and **the coordination**, working seven
desk-bound modules (enrolments, classes, students, catechists, school years, calendar, reports).

Everything in this skill is extracted from working source, not invented. The design decisions
that matter most all follow from those two audiences: 44px touch floors, 15px body so a
22-name roster fits one phone screen, and a permanent network chip because offline is the
product's defining trait rather than an error state.

## When to use

**Use this skill for:**

- Any new screen, module or component in the catechism product
- Editing or extending the preserved source screens
- Porting the language to another stack (Tailwind, CSS-in-JS, design tokens)
- Any artifact that should read as part of this product — reports, emails, print

**Do not use it for:** a different product with its own brand, or for a dark-themed surface
(the system defines full-ink *surfaces* like `.auth-aside`, but no dark colour scheme —
that would be new design work, not extraction).

## How to use

1. **Link the stylesheet** — `assets/catequese-ds.css`. Do not re-declare tokens or restyle
   components.
2. **Pick the shell** — `.auth`, `.appbar`, or `.shell`. See §2 below.
3. **Copy from the nearest preserved screen** rather than starting blank. `chamada.html` for
   a list with actions, `admin.html` for a console, `inscricao.html` for a multi-step form,
   `login.html` for auth.
4. **Compose with the primitives** — `.stack`/`.row` families, `.card-flush` + `.panel-head`.
5. **Write pt-BR copy** in the register described in §6.
6. **Run the checklist** in §9 before shipping.

## Design-system highlights

Six things that make output recognisably part of this system:

1. **No colour literal outside `:root`.** Everything derives with `color-mix()`. The source
   names raw inline hex as the specific defect the redesign was fixing.
2. **One teal means action *and* present.** `--accent` is the primary button, the
   present-marking, the meter fill and the active nav item — deliberately, so the same colour
   always means the same thing. Never add a second action colour.
3. **The serif is the mark's alone.** `--font-logo` on `.wordmark` and nowhere else. The sans
   says "tool"; the small-caps serif says "institution"; only the mark changes voice.
4. **A disabled button says why.** `Faltam 4`, not a greyed-out `Confirmar chamada`.
5. **Offline is visible.** Permanent network chip, queue banner with an inline sync action,
   worded local-save confirmation.
6. **Every comparable number is mono tabular** (`.num`), which is what makes a 22-row
   attendance table's columns line up.

## 0. Before writing anything

1. **Link the stylesheet, don't rewrite it.**
   ```html
   <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
   <link rel="stylesheet" href="assets/catequese-ds.css" />
   ```
   `assets/catequese-ds.css` already contains the tokens *and* every component. Do not
   re-declare tokens, do not restyle a button. Page-specific CSS goes in a small `<style>`
   block and may only compose existing tokens.

2. **Pick the shell first** — see §2. Picking the wrong one is the most expensive mistake.

3. **Write in Brazilian Portuguese**, `<html lang="pt-BR">`. This is a pt-BR product.

4. **Copy from a preserved screen.** The closest source file is a better starting point
   than a blank page. `chamada.html` for a list-with-actions, `admin.html` for a console,
   `inscricao.html` for a multi-step form, `login.html` for auth.

## 1. Tokens — the hard rules

**No colour literal anywhere outside `:root`.** Not in a style attribute, not in a
component rule. Derive with `color-mix(in srgb, var(--token) N%, var(--surface))`.

| Need | Use |
|---|---|
| Page canvas | `--bg` |
| Any card, input, panel | `--surface` |
| Primary / secondary ink | `--fg` / `--muted` |
| Hairline, resting border | `--border` |
| Primary action **and** present | `--accent` |
| Text on an accent-soft ground | `--accent-ink` |
| Liturgical calendar, renewal | `--gold` family — **signal only, never a button** |
| Pending / queued / below target | `--warn` family |
| Absent / rejected / destructive | `--danger` family |
| Neutral advisory | `--info` family |

State colours always come as a triad. `--x` fills bars, borders and pressed buttons;
`--x-soft` is the chip/banner ground; `--x-ink` is text on that ground.
**Never put `--danger` or `--warn` as text directly on white** — use the `-ink` variant.

Spacing is `--sp-1`…`--sp-8` (4px multiples). Radius is `--r-sm` 8 / `--r` 12 / `--r-lg` 16
/ `--r-xl` 22 / `--r-full`. Shadows only on things that move or can be pressed —
a resting panel uses `--border`.

## 2. Choose the shell

| Screen kind | Shell | Structure |
|---|---|---|
| Login, first access, any credential gate | `.auth` | Full-ink aside (mark + `.display` promise + `.dot-grid`) ‖ centred 392px card |
| Catechist-facing or public (dashboard, enrolment, overview) | `.appbar` + `.container` | Sticky blurred header: brand → nav → spacer → **network chip** → user |
| Coordination console | `.shell` | 244px sticky sidebar with `.nav-label` groups ‖ `.workarea` |

On the appbar shell, phone layout moves the primary action into a sticky
`.actionbar` at the bottom. On the admin shell at 1024px the sidebar becomes a
horizontally scrolling strip — **never a hamburger.**

## 3. Compose the page

```html
<main class="container" style="padding-block: var(--sp-6) var(--sp-8);">
  <div class="stack-lg">
    <section class="stack">
      <p class="eyebrow eyebrow-accent">Sábado, 25 de julho de 2026</p>
      <h1>Bom dia, Marina</h1>
      <p class="lead">One sentence of orientation, capped at 62ch.</p>
    </section>
    <!-- more sections, each a .card or .card-flush -->
  </div>
</main>
```

- `.stack` (16) / `.stack-sm` (8) / `.stack-lg` (32) for vertical rhythm;
  `.row`, `.row-tight`, `.row-between` for horizontal clusters. All wrap.
- Anything containing a table or list is `.card-flush` + `.panel-head` / `.panel-foot`.
  Title left, mono `.meta` count right.
- Forms and prose use `.container-narrow` (760px).
- Every flex row holding a name needs `min-width: 0`; every long-string cell needs
  `overflow-wrap: anywhere`; every table sits in `.table-wrap`.

## 4. Components — the specific moves

**Buttons.** One `.btn-primary` per screen. `.btn-secondary` for toolbars, `.btn-ghost`
for cancel and icon buttons, `.btn-danger` is outlined (never a filled red button).
`.btn-sm` (34px) is **admin-desk only** — never on a catechist surface.

> **A disabled button says why.** Label it `Faltam 4`, not a greyed-out `Confirmar`.

**State goes in a `.chip`**, never in a filled card. `chip-ok` / `-warn` / `-danger` /
`-info` / `-gold` / bare. A row may take a 4–5% wash (`.list-row.is-yes` / `.is-no`).

**Fields.** `.field` wraps label → control → `.hint` or `.err`. Mark invalid with
`aria-invalid="true"` — that attribute *is* the styling hook. Placeholders teach rather
than repeat the label. Two-option questions use `.choice-row` + `.choice` tiles, not
bare radios.

**Attendance marking** uses `.seg` / `.seg-btn` with `aria-pressed`. There is **no hidden
neutral default**: unmarked rows stay white and stay countable, which is what makes the
confirm button's remaining-count honest.

**Numbers.** Every comparable number gets `.num` (mono + `tabular-nums`). Numeric table
columns get `.num-col`. Table headers are mono 11px uppercase on `--surface-2`.

**Charts** use `.bars` — filled, never outlined — with `role="img"` and an `aria-label`
that reads the whole series. `.meter` for a single proportion.

**Enrolment review is a `.drawer`, not a modal.** The list stays visible behind it.
Escape and scrim close it.

**Every empty state** (`.empty`) says what happened and what to do next.

## 5. Brand

- Coat of arms goes **inline as SVG** with `class="mark"` so it inherits tokens. Copy the
  three-path markup from any preserved screen. Use `assets/*.svg` only where CSS custom
  properties can't reach: favicon, PWA, email, print.
- Over full ink, wrap in `.on-ink` (or use `.auth-aside`) and the field and cross invert
  automatically. The gold fillet stays in both.
- Minimum 20px tall; below that use the favicon form.
- `.wordmark` is the **only** place `--font-logo` may appear. Never a serif heading.
- `.dot-grid` appears at most once per screen, and only on brand surfaces.

## 6. Copy

Plain, warm, concrete, second person, pt-BR. Explain the mechanism in one short sentence:
*"A chamada fica salva no aparelho e sobe sozinha quando o sinal voltar."*

Sentence case everywhere. The only uppercase is `.eyebrow`, `.meta`, table headers and the
wordmark. `·` separates metadata. Errors name the fix. Demo surfaces say so.

## 7. Interaction

140–220ms, on colour/shadow/position only. Async: disable → present-participle label
(`Salvando…`) → worded confirmation; never a wordless spinner. Focus is a 2px accent ring.
Use `window.scrollTo`, **never `scrollIntoView`** (it breaks the embedded preview).

## 8. Never

1. A colour literal outside `:root` · 2. A second serif · 3. Gold as an action ·
4. Two primary buttons · 5. A silent disabled button · 6. A state-filled card ·
7. A hidden network state · 8. A neutral default in the attendance control ·
9. A hamburger on the admin shell · 10. A modal for enrolment review ·
11. Sub-44px controls on catechist surfaces · 12. Outline-only charts ·
13. Parchment, cream canvases, gold gradients, devotional stock photography ·
14. Emoji icons · 15. `scrollIntoView` · 16. Invented metrics.

## 9. Before shipping — check

- [ ] Zero hex or raw colour outside `:root`
- [ ] Exactly one `.btn-primary`; any disabled button explains itself
- [ ] Every comparable number in `.num`
- [ ] `--font-logo` only on `.wordmark`
- [ ] All controls ≥44px on catechist/public surfaces
- [ ] Network state visible if the screen writes data
- [ ] Every state in a chip, not a filled card
- [ ] Empty states name a next step
- [ ] `data-od-id` on regions, headings, CTAs and repeated cards
- [ ] No horizontal scroll at 390px; tables wrapped; long names wrap
- [ ] Charts filled, with `role="img"` + `aria-label`
- [ ] Copy is pt-BR, sentence case, mechanism explained in plain words
