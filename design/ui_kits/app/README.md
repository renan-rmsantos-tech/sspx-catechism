# Applied interface kit — Catequese

The real product surfaces of the parish catechism manager, built on the
[Catequese design system](../../DESIGN.md). Not mockups: every page here is a working
surface with live interaction, wired to `assets/catequese-ds.css`, with no colour literal
outside `:root`.

Open the surface closest to what you're building, copy its skeleton, swap the content.

---

## Structure

Two layers, because the product has two: the prototypes are static HTML, while the
shipping app (`sspx-catechism`) is React.

### Pages — working surfaces

| File | Shell | What it demonstrates |
|---|---|---|
| [`index.html`](index.html) | `.appbar` | Kit overview and inventory — **start here** |
| [`attendance-sheet.html`](attendance-sheet.html) | `.appbar` + `.actionbar` | **The product's core interaction.** Search, mark-all, sticky progress rail, honest counts, the `Faltam N` button, offline save |
| [`shell-catechist.html`](shell-catechist.html) | `.appbar` | Permanent network chip, sync-queue banner with inline action, `--r-xl` hero card, class cards with meters, phone action bar |
| [`shell-admin.html`](shell-admin.html) | `.shell` | Persistent sidebar with pending badge, five modules, filterable tables, calendar with gold holy days, filled bar chart, **review drawer** with approve/reject |
| [`shell-auth.html`](shell-auth.html) | `.auth` | Full-ink split panel, both login and first-access modes, additive live password rules |
| [`components.html`](components.html) | `.appbar` | Every component beside its minimal markup, ready to copy |

All of them link to each other, so you can walk the product as a flow:
auth → catechist dashboard → attendance sheet, or auth → admin console → review drawer.

### Components — React primitives

`components/` holds the same components as JSX, for the actual `sspx-catechism` codebase.
This is not speculative: the source's own before/after analysis records that the shipping
app had only two shared components (`button.tsx`, `card.tsx`) with the rest as loose
Tailwind and inlined hex, and named porting `catequese-ds.css` into real token-bound
components as the next step. These are that port.

| File | Exports | The rule it encodes |
|---|---|---|
| [`components/Button.jsx`](components/Button.jsx) | `Button`, `ConfirmAttendanceButton` | A disabled button must explain itself — `disabledLabel` is required, and its absence warns in dev |
| [`components/Chip.jsx`](components/Chip.jsx) | `Chip`, `NetworkChip`, `AttendanceChip` | State lives in a chip, never a filled card; the network chip is permanent |
| [`components/AttendanceRow.jsx`](components/AttendanceRow.jsx) | `AttendanceRow`, `tallyMarks` | `null` is a real, visible, countable state — no hidden neutral default |
| [`components/Field.jsx`](components/Field.jsx) | `Field`, `TextField`, `SelectField`, `TextAreaField`, `ChoiceGroup`, `SearchField` | `aria-invalid` *is* the styling hook, so visual and a11y state can't drift |
| [`components/Sidebar.jsx`](components/Sidebar.jsx) | `Sidebar`, `Shell` | The console nav becomes a scrolling strip at 1024px, never a hamburger |
| [`components/ReviewDrawer.jsx`](components/ReviewDrawer.jsx) | `ReviewDrawer`, `Facts`, `isRejectionValid` | A drawer, not a modal — the queue stays visible behind it |
| [`components/Metrics.jsx`](components/Metrics.jsx) | `Stat`, `StatTile`, `Meter`, `Bars`, `ProgressRail` | Charts fill and carry `role="img"`; every comparable number is `.num` |

They consume the same class names as the HTML, so both layers stay in sync with one
stylesheet. There is no separate React theme to maintain.

`index.html` mounts five of them live, so the primitives are demonstrably real rather than
inert files. **That one block is progressive enhancement:** it resolves `react@18.3.1`,
`react-dom@18.3.1` and `@babel/standalone@7.29.0` over the network, so opening the page
offline (or capturing it before the module graph resolves) leaves a labelled fallback in
its place. Everything else in the kit — all six pages — is fully static and needs no
network and no build step.

---

## Usage

### 1. Pick a shell

This is the first and most consequential decision.

- **`.auth`** — any credential gate. Full-ink aside (mark + `.display` promise + `.dot-grid`)
  beside a centred 392px card. One column at 860px.
- **`.appbar` + `.container`** — catechist-facing and public screens. Sticky blurred
  header: brand → nav → spacer → **network chip** → user. At 720px the nav disappears
  and the primary action moves into a sticky `.actionbar` at thumb height.
- **`.shell`** — the coordination console. 244px sticky sidebar with mono group labels.

### 2. Load the stylesheets

Every page in this kit loads all three, tokens first:

```html
<link rel="stylesheet" href="../../colors_and_type.css" />
<link rel="stylesheet" href="../../tokens.css" />
<link rel="stylesheet" href="../../assets/catequese-ds.css" />
```

Inside the product you can use `catequese-ds.css` alone — it carries the same `:root`.
The two token files matter when you copy the language somewhere else.

### 3. Copy, then compose

Copy the skeleton of the nearest page and swap the content. In React, import the
primitives and build from them:

```jsx
import { ConfirmAttendanceButton } from './components/Button';
import { AttendanceRow, tallyMarks } from './components/AttendanceRow';
import { ProgressRail } from './components/Metrics';

const { present, absent, pending } = tallyMarks(marks, students.length);
// pending drives BOTH the rail and the button label, so they cannot disagree
```

Do not re-declare tokens and do not restyle a component. If you need a new colour, you
need a `color-mix()` of an existing one.

### 4. Check before shipping

The full checklist is at the end of [`SKILL.md`](../../SKILL.md).

---

## Design notes

What every file here holds to, verified across all six pages and seven components:

- **No colour literal outside `:root`.** Everything derives via `color-mix()`. The colours,
  typography and spacing all come from the extracted tokens — nothing here invents a value.
- **One `.btn-primary` per screen**, and every disabled button explains itself
  (`Faltam 4`, not a greyed-out `Confirmar`).
- **44px touch floor.** `.btn-sm` (34px) appears only in `shell-admin.html`, at a desk.
- **Every comparable number in `.num`** — mono, `tabular-nums`.
- **`--font-logo` only on `.wordmark`.** No serif headings.
- **The network chip is permanent** on any screen that writes data.
- **State lives in a chip** plus a 4–5% row wash — never a filled card.
- **Charts fill**, and carry `role="img"` with a full `aria-label`.
- **`window.scrollTo`, never `scrollIntoView`** (the latter breaks the embedded preview).
- **`data-od-id`** on regions, headings, CTAs and repeated cards.
- Copy is Brazilian Portuguese, sentence case, mechanism explained in plain words.

---

## Source

Based on the Open Design project **Catechism** (`da2f6d22-b8b8-4038-9e5f-ad6f163d3220`),
linked to `~/Projects/rmtech/sspx-catechism`. The kit is a **rework** of that evidence, not
a copy — the originals live unmodified at the project root and are framed live in
[`preview/applied-surfaces.html`](../../preview/applied-surfaces.html).

What the kit adds beyond the source:

- `shell-auth.html` merges `login.html` and `trocar-senha.html` into one file with a mode
  switch, so the whole auth shell reads at once.
- `shell-admin.html` makes the enrolment decisions **persist** — approving or rejecting
  updates the row chip, the four stat tiles and the sidebar pending badge, so the review
  loop can be walked end to end.
- `components.html` and `components/` have no equivalent in the source.
- Empty states gained recovery actions (`Limpar a busca`, `Abrir o calendário do ano`),
  applying the system's own rule that an empty state names a next step.

Data throughout is the source's own demo fixtures, labelled *"dados de demonstração"*.

## Where to look next

- [`DESIGN.md`](../../DESIGN.md) — the system: colour, typography, spacing, layout,
  components, motion, voice, anti-patterns
- [`SKILL.md`](../../SKILL.md) — build instructions and the pre-ship checklist
- [`preview/index.html`](../../preview/index.html) — ten focused review cards
- [`assets/catequese-ds.css`](../../assets/catequese-ds.css) — every component, verbatim
