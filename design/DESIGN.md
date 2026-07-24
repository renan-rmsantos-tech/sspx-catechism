# Catequese — Design System

> Category: Project Design System · Surface: responsive web (phone-first, desktop admin)
> Design system id: `user:catechism-design-system`
> Derived from Open Design project **Catechism** (`da2f6d22-b8b8-4038-9e5f-ad6f163d3220`),
> linked to `~/Projects/rmtech/sspx-catechism`.
> Every value below is extracted from a real source file. See [`context/provenance.md`](context/provenance.md) for the file-by-file trail.

---

## 1. Product context & visual atmosphere

**The product.** Parish catechism management for a traditional-rite (SSPX) parish. Two audiences with almost nothing in common:

- **Volunteer catechists** — mostly non-technical, using a phone, standing up in a parish hall, often with no signal. They do one thing: take attendance for a class of 14–22 children.
- **The coordination** — a priest or lay coordinator at a desk, working seven modules: enrolments, classes, students, catechists, school years, calendar, reports.

**The direction: Human / approachable.** Chosen in the source (`design-system.html`, `index.html`) and held consistently across all seven screens. Its own words:

> *"Um sistema calmo, para quem usa de pé, no salão paroquial."*
> A calm system, for someone using it standing up, in the parish hall.

**What the atmosphere is.** Sober and warm. Cool near-white canvas, generous white cards, one teal that means *do this* and *present*. Type does the hierarchy work, not colour and not chrome. Density is real — a roster of 22 names must fit — but never cramped: 44px touch targets are absolute.

**What the atmosphere is not.** Not a "church app" in the decorative sense: no parchment, no ornament, no gold gradients, no stock imagery of hands and candles. The only devotional gesture in the entire system is the coat of arms and a single liturgical-gold accent, and both are rationed. The interface reads as a tool; the *mark* carries the institution.

**The one idea to keep if you keep nothing else.** *Offline is a feature, so make it visible.* Catechists mark attendance with no signal. The source treats that as the defining product trait: a permanent network chip in every header, a queue banner with a sync action on the dashboard, an explicit "you can mark without a connection" note on the attendance sheet, and a save confirmation that says the data is on the device. Never hide the connection state to look tidier.

---

## 2. Color

All values are `oklch()`. **No color literal may exist outside `:root`.** Every other colour in the product is derived with `color-mix()`. This is the system's hardest rule — it is what made the source coherent across seven screens.

Full definitions: [`colors_and_type.css`](colors_and_type.css). Live cards: [`preview/colors-primary.html`](preview/colors-primary.html), [`preview/colors-states.html`](preview/colors-states.html).

### The core six

| Token | Value | Role |
|---|---|---|
| `--bg` | `oklch(98% 0.004 240)` | Page canvas. Cool near-white, never warm/cream. |
| `--surface` | `oklch(100% 0 0)` | Cards, inputs, panels, table body. Pure white. |
| `--fg` | `oklch(20% 0.02 240)` | Primary ink. |
| `--muted` | `oklch(50% 0.018 240)` | Secondary ink, captions, resting nav labels. |
| `--border` | `oklch(90% 0.006 240)` | Hairlines and resting card edge. |
| `--accent` | `oklch(56% 0.12 170)` | **Teal. Primary action *and* present-marking.** |

The 240° hue on every neutral is deliberate: the greys are cool, so the teal accent reads as the same family rather than a sticker.

### The accent carries two meanings on purpose

`--accent` is the primary button **and** the "present" state **and** the attendance meter fill **and** the active nav item. That is not overload — it is the system's central semantic bet: *the same colour means the same thing everywhere.* Teal always means "this is the forward motion." Do not introduce a second action colour.

Derived: `--accent-soft` (12% on surface, chip/banner ground), `--accent-line` (32%, hovered card border), `--accent-ink` `oklch(40% 0.09 170)` (text on soft, and the full-ink auth panel), `--accent-press` (86% + black, hover on primary).

### Liturgical gold — the domain accent

`--gold: oklch(82% 0.135 95)` · `--gold-soft` · `--gold-ink: oklch(48% 0.085 95)`

Gold is a **signal, not an action.** It appears in exactly three places in the source: holy days of obligation in the calendar grid and dot-grid motif, the "renovação" (renewal) chip on an enrolment, and the inner fillet of the coat of arms. It is never a button, never a third brand colour, never a gradient.

### Functional states — always a triad

Every state ships as base / `-soft` / `-ink`. **Never use the base as text on white.**

| State | Base | Means |
|---|---|---|
| `--warn` | `oklch(69% 0.16 48)` | Pending, queued for sync, attendance below target |
| `--danger` | `oklch(55% 0.19 25)` | Absent, rejected, destructive action |
| `--info` | `oklch(58% 0.10 250)` | Neutral advisory (the offline hint) |

### Color rules the source holds

- **USE** accent for the one primary action on a screen and for present-marking — at most two full-strength uses per screen.
- **USE** gold only for the liturgical calendar and enrolment renewal.
- **DON'T** colour whole cards by state. State lives in the chip and in the row's tint (`.list-row.is-yes` is a 5% accent wash, not a filled card).
- **DON'T** create new colour tokens. Derive with `color-mix()` from what exists.

---

## 3. Typography

Live card: [`preview/typography-specimens.html`](preview/typography-specimens.html).

**No webfont is loaded anywhere.** A decision, not an omission: volunteers open this on phones over parish wifi, so type must render at first paint with zero network cost.

| Stack | Token | Used for |
|---|---|---|
| Söhne → Avenir Next → system | `--font-display` | All headings, `.display`, stat numbers, avatar initials |
| System sans (`-apple-system`…) | `--font-body` | Body, labels, inputs, buttons |
| `ui-monospace` → SF Mono → JetBrains | `--font-mono` | Every number, eyebrow, table header, `.meta` |
| Iowan Old Style → Charter → Georgia | `--font-logo` | **The wordmark and nothing else** |

### The serif exception, stated explicitly

The source is emphatic about this (`logo.html`, `design-system.html`): the geometric sans of the interface says *"tool"*; the small-caps serif at 0.17em tracking says *"institution"*. Only the mark changes voice. **`--font-logo` appears on `.wordmark` and in no other rule.** Screen titles, tables, buttons and labels stay in the sans. Breaking this is the single fastest way to make output stop looking like this system.

### Scale

| Role | Size | Weight / tracking |
|---|---|---|
| `.display` | `clamp(30px, 4.2vw, 44px)` | 660 · −0.03em · lh 1.06 |
| `h1` | `clamp(24px, 3vw, 30px)` | 640 · −0.022em · lh 1.15 |
| `h2` | 20px | 620 · −0.016em |
| `h3` | 16px | 600 · −0.01em |
| body | **15px** / 1.5 | 400 |
| `.small` | 13.5px | — |
| `.meta` / `.eyebrow` | 12px / 11px mono | 0.01em / 0.1em uppercase |

Body is 15px, not 16 — the screens are dense with names and dates, and 15/1.5 fits a full class roster on a phone without a second scroll.

Headings use 640/620/600, never 700: at these sizes 700 reads shouty. Negative tracking tightens as size grows.

### The numeric rule

**Every number the user compares goes in `.num`** — mono with `font-variant-numeric: tabular-nums`. Percentages, tallies, dates, phone numbers, protocol codes, school years. This is what makes a 22-row attendance table's columns actually line up. Numeric table columns get `.num-col` (mono, right-aligned, `nowrap`).

---

## 4. Spacing

Live card: [`preview/spacing-tokens.html`](preview/spacing-tokens.html). Definitions: [`tokens.css`](tokens.css).

Strict multiples of 4, doubling from 16 up:

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48 · `--sp-8` 64

**How the source actually uses them:** `--sp-4` is the workhorse gap (grids, rows, stacks). `--sp-5` is card padding and the gap between page sections. `--sp-3`/`--sp-2` for tight inline clusters. `--sp-7`/`--sp-8` for page top/bottom rhythm and empty states.

Three stack helpers do most of the layout work and are worth copying verbatim: `.stack` (column, gap 16), `.stack-sm` (gap 8), `.stack-lg` (gap 32). Plus `.row`, `.row-tight`, `.row-between` for horizontal clusters — all `flex-wrap: wrap` so nothing overflows on a phone.

**Touch: `--touch: 44px` minimum on any control.** Non-negotiable — the primary user is standing up. `.btn-lg` is 52px; `.btn-sm` drops to 34px but is only allowed in desk-bound admin toolbars and table action cells, never on the attendance sheet.

---

## 5. Layout & composition

Live card: [`preview/layout-and-shape.html`](preview/layout-and-shape.html).

The source ships **three distinct shells**, and picking the right one is most of the design work:

### `.auth` — full-bleed split (login, first access)
`grid-template-columns: 1.05fr 1fr`. Left is a full-ink panel (`linear-gradient(165deg, --accent-ink → 60% black)`) carrying the mark, a `.display` promise line, and the dot-grid calendar motif. Right is a centred `max-width: 392px` card. Collapses to one column at 860px, and the aside footer is dropped rather than squeezed.

### `.appbar` + `.container` — catechist screens (dashboard, enrolment, overview)
Sticky translucent header (`color-mix(--surface 86%)` + `blur(14px) saturate(140%)`), 62px min-height, containing brand → nav → spacer → **network chip** → user. Content in a 1200px container; forms and prose drop to `.container-narrow` at 760px. At 720px the header nav disappears and a sticky `.actionbar` takes over the primary action at the bottom of the viewport.

### `.shell` — coordination console (admin)
`grid-template-columns: 244px 1fr` with a sticky full-height sidebar. Nav is grouped under mono uppercase `.nav-label` headings ("Ano letivo" / "Estrutura"), the active item is `--accent-soft` + `--accent-ink`, and a pending count rides as a gold `.badge` on the right of the nav item. At 1024px the sidebar becomes a horizontally scrolling top strip and the group labels are hidden — it does not become a hamburger.

### Composition rules

- **Grids:** `.grid-2/3/4` and `.grid-auto` (`auto-fit, minmax(230px, 1fr)`). `grid-4` → 2 columns at 1024px; all grids → 1 column at 720px.
- **Page head:** `.page-head` pairs eyebrow + `h1` on the left with a `.toolbar` of small secondary buttons on the right, `align-items: flex-end`.
- **Panels:** `.card-flush` + `.panel-head` / `.panel-body` / `.panel-foot` is the standard container for anything with a table or list inside it. The head carries the title on the left and a mono `.meta` count on the right.
- **The drawer, not a modal.** Reviewing an enrolment opens a right-side `.drawer-panel` (`min(460px, 100%)`, `--shadow-3`, 220ms slide) so the coordinator never loses the list. Approve/reject live inside it. Escape and scrim both close.
- **Overflow discipline:** every long-string cell carries `overflow-wrap: anywhere`, tables live in `.table-wrap` with `overflow-x: auto`, and every flex row that holds a name has `min-width: 0`.

---

## 6. Components

Live cards: [`preview/components-buttons.html`](preview/components-buttons.html), [`preview/components-forms.html`](preview/components-forms.html), [`preview/components-data.html`](preview/components-data.html). Working code: [`assets/catequese-ds.css`](assets/catequese-ds.css) and the ten preserved screens.

### Buttons — `.btn`
44px min-height, `--r` radius, weight 560, `-0.01em`. Transition on background/border/color/shadow at 160ms plus a 60ms `translateY(1px)` on `:active`.

| Variant | Treatment | Rule |
|---|---|---|
| `.btn-primary` | `--accent` fill, `--shadow-2`, hover `--accent-press` | **One per screen.** |
| `.btn-secondary` | surface + border + `--shadow-1` | Toolbar, export, back |
| `.btn-ghost` | transparent, `--muted` ink | Cancel, icon buttons |
| `.btn-danger` | surface + danger border, `--danger-ink` text | Never a filled red button |

Sizes: `.btn-sm` 34px (admin only) · default 44 · `.btn-lg` 52 · `.btn-icon` 40×40 · `.btn-block`.

**A disabled button must say why it is disabled.** The source's signature move: on the attendance sheet the confirm button reads `Faltam 4` ("4 still missing") until every student is marked, then becomes `Confirmar chamada`. Never ship a greyed-out button with an unchanged label.

### Chips — `.chip`
Pill, 12px, weight 560, with a 6px dot of `currentColor` before the label (`.chip-plain` removes it). Variants map straight onto the state triads: `-ok` (accent), `-warn`, `-danger`, `-info`, `-gold`, plus bare grey for neutral ("Sem aula hoje"). This is the primary state carrier in the whole product.

### Fields — `.field` / `.input` / `.select` / `.textarea`
Column with a 6px gap: label (13.5px, weight 560) → control → `.hint` or `.err` (12px). Controls are 44px, `--r`, 1px border, focus = accent border + `0 0 0 3px accent@18%` ring. Invalid uses `aria-invalid="true"` — **the attribute is the styling hook**, so the visual and the accessibility state can't drift apart. `.select` draws its own chevron from two gradients (no background image). `.search-wrap` positions a 16px icon at 13px left with `.input-search` padding to match.

`.choice` is the radio/checkbox replacement: a 44px bordered tile that uses `:has(input:checked)` to go accent-soft. `.choice-row` puts two side by side.

### Attendance segmented control — `.seg` / `.seg-btn`
The product's most-used control and its most specific one. Two 46×44 buttons, check and cross. Pressed-yes fills `--accent`; pressed-no fills `--danger`; both use `aria-pressed`. **There is no hidden neutral default** — an unmarked row stays white and counts toward "sem marcar", which is what lets the confirm button report an honest remaining count. Rows tint at 5% accent / 4% danger — a wash, never a filled card.

### Lists & tables
`.list` with `border-top` between rows, `.list-row` at 12px/24px with a 38px rounded `.avatar` (initial in display face) and hover on `--surface-2`. `.table` at 13.5px; headers in **mono 11px uppercase 0.08em on `--surface-2`**; numeric columns right-aligned mono; last row loses its border; whole-row hover.

### Metrics
`.stat` = 30px display number (660, −0.035em, tabular) over a 13.5px muted label; `.stat-unit` is a 0.5em muted suffix so `86%` reads as one unit. `.meter` is a 7px pill track with an accent fill (`.warn` / `.danger` modifiers). `.bars` is a 172px flex chart — **filled bars, never outlines** — with the value above and a mono caption below, and it carries `role="img"` plus a full `aria-label` describing the series.

### Banners — `.banner`
16–17px icon + text, state-soft ground, state-tinted border, `--r`. Four variants matching the state triads. Used for the sync queue (with an inline "Sincronizar agora" button), the offline hint, form errors (`role="alert"`, `hidden` until needed), and success.

### Stepper — `.stepper` / `.step`
Equal-width 4px rails above mono uppercase captions. Done = solid accent; current = `linear-gradient(90deg, accent 50%, surface-3 50%)`. Captions hide below 720px, rails stay. Used for the 4-step public enrolment.

### Empty states — `.empty`
Centred, 28px muted icon, one sentence. **Every empty state says what happened and what to do next.** No bare "No results."

### Brand assets
Coat of arms: heater shield, Latin cross with chamfered terminals voided in the field, inner gold fillet. Shipped two ways on purpose:

- **Inline SVG** (`.mark`, viewBox `0 0 40 51`) inside HTML, so field/cross/fillet come from tokens. `--mk-field` flips the voided cross; `.on-ink` / `.auth-aside` invert it automatically over full ink.
- **Files in `assets/`** for anything the document's custom properties can't reach — favicon, PWA icon, email, print. These carry literal `oklch()` mirroring the tokens, and **must be updated by hand if the tokens change.**

Minimum 20px tall. Below that use the favicon form: no fillet (it turns to dirt at 16px) and a straight-armed cross 38% thicker so it doesn't close up. Wordmark gap is always one third of the shield height.

**Graphic motif:** `.dot-grid` — a 12-column dot grid standing for the school-year calendar. Filled dot = class day, gold dot = holy day of obligation. **One appearance per screen**, and only on brand surfaces (auth aside, brand pages), never inside product UI.

---

## 7. Motion & interaction

- **140–220ms, on colour, shadow and position only.** Nothing animates content height, width or opacity. Buttons 160ms; cards 180ms; drawer 220ms `cubic-bezier(.2,.7,.3,1)`; progress fill 200ms.
- **Press feedback is physical:** `translateY(1px)` at 60ms on `.btn:active`.
- **Hover elevates, it doesn't recolour:** `.card-link:hover` gains `--shadow-2`, an `--accent-line` border and `translateY(-2px)`.
- **Focus:** 2px `--accent` outline at 2px offset, always visible via keyboard, `--r-sm` corner.
- **Async has three states and says all three.** Every submit in the source disables the button, swaps the label to a present participle (`Entrando…`, `Salvando…`, `Enviando…`), then resolves to a confirmation. Never a spinner with no words.
- **Live validation is additive, not punitive.** The password screen turns each rule's outline circle into a check as it's satisfied (`aria-live="polite"`), rather than showing errors while typing.
- **`prefers-reduced-motion: reduce` collapses all durations to 0.001ms.** Already in the base CSS — keep it.

---

## 8. Voice & brand

**Language: Brazilian Portuguese (`lang="pt-BR"`).** All UI copy ships in pt-BR. Keep it.

**Register: plain, warm, concrete, second person.** The source never uses system-speak. It explains mechanism in one short sentence, in the words a volunteer would use.

| Instead of | The source writes |
|---|---|
| "Sync pending" | *"1 chamada aguardando envio. Foi registrada sem conexão e será sincronizada automaticamente."* |
| "Offline mode available" | *"Pode marcar sem conexão. A chamada fica salva no aparelho e sobe sozinha quando o sinal voltar."* |
| "Submit" (disabled) | *"Faltam 4"* |
| "Required field" | *"Informe o nome completo do catequizando."* |
| "Name" | *"Nome completo — como consta na certidão de batismo"* |

**Rules:**

- Sentence case everywhere. The **only** uppercase is `.eyebrow`, `.meta`, table headers and the wordmark — all mono or serif, never body sans.
- Placeholders teach, they don't repeat the label: `"Como consta na certidão de batismo"`, `"Paróquia, capela ou colégio — e por quanto tempo"`.
- Errors name the fix, not the failure.
- Empty states end with a next step.
- Domain vocabulary is exact and stays in Portuguese: *chamada, catequizando, catequista, coordenação, turma, ano letivo, Primeira Comunhão, Crisma, renovação, festa de guarda, salão paroquial.*
- Middle dot `·` is the standard separator in metadata lines: `Sábado, 10h30 · Salão paroquial · 22 alunos`.
- Demo surfaces label themselves: *"Protótipo · dados de demonstração."*

---

## 9. Anti-patterns

Things this system must never generate:

1. **A colour literal outside `:root`.** No hex in a component rule. Derive with `color-mix()`. (The source names this as the specific failure of the pre-redesign codebase, which had raw hex greens and reds inlined in the attendance screen.)
2. **A second serif.** `--font-logo` on `.wordmark` only. A serif heading breaks the system's central type argument.
3. **A second action colour.** Teal is action and presence. Gold is liturgical signal only — never a button.
4. **Two primary buttons on one screen.**
5. **A disabled button with an unchanged label.** Say what's missing.
6. **State as a filled card.** State belongs in a chip and a 4–5% row wash.
7. **Hiding the network state** to make a header look cleaner. The chip is permanent.
8. **A hidden neutral default in the attendance control.** Unmarked must stay visibly unmarked and countable.
9. **A hamburger menu on the admin shell.** At 1024px it becomes a scrolling strip; the modules stay visible.
10. **A modal for enrolment review.** It's a drawer — the list must stay behind it.
11. **Controls under 44px** on any catechist-facing surface. `.btn-sm` is admin-desk only.
12. **Outline-only charts.** `.bars` fills. Every chart carries `role="img"` and a descriptive `aria-label`.
13. **Warm beige/cream canvases, parchment textures, gold gradients, candle/hands stock imagery, ornamental borders.** The devotional register lives in the mark alone.
14. **Emoji as icons.** Icons are 1.7-weight stroked SVG on a 24 viewBox, sized 17px in buttons and nav.
15. **`scrollIntoView`** — it breaks the embedded preview. The source uses `window.scrollTo`.
16. **Invented metrics.** If a number isn't in the evidence, label it as a placeholder.

---

## 10. Where things live

| Path | What |
|---|---|
| [`colors_and_type.css`](colors_and_type.css) | Colour + type tokens and type roles |
| [`tokens.css`](tokens.css) | Radius, spacing, elevation, layout, motion |
| [`assets/catequese-ds.css`](assets/catequese-ds.css) | **The full source stylesheet** — every component, preserved verbatim |
| [`assets/`](assets/) | Coat of arms (light/dark), favicon, PWA icon |
| [`build/`](build/) | Runtime icon set + web app manifest |
| [`preview/`](preview/) | Ten focused review cards — start at `preview/index.html` |
| [`ui_kits/app/`](ui_kits/app/) | Applied interface kit — six working product surfaces |
| [`ui_kits/app/components/`](ui_kits/app/components/) | React primitives that bind these tokens, for the `sspx-catechism` codebase |
| Root `*.html` | **Preserved source screens**, working and unmodified |
| [`context/provenance.md`](context/provenance.md) | File-by-file evidence trail and known drift |

**No `fonts/` directory.** By design — see §3. This system loads no webfont.
