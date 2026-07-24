# Catequese — Design System Package

A reusable design system extracted from the Open Design project **Catechism**
(`da2f6d22-b8b8-4038-9e5f-ad6f163d3220`, linked to `~/Projects/rmtech/sspx-catechism`).

It is the visual language of a parish catechism manager for a traditional-rite (SSPX)
parish: **calm, dense-but-tappable, phone-first, and honest about being offline.**
Cool near-white canvas, one teal that means *action* and *present*, liturgical gold
rationed to the calendar, and a single serif reserved entirely for the coat of arms.

Everything here was extracted from working source, not invented. The
[provenance notes](context/provenance.md) map each claim back to the file it came from.

---

## Product overview

**What the product is.** A parish catechism manager for a traditional-rite (SSPX) parish.
The application supports two audiences that share almost nothing, and it was designed
around the harder of the two:

- **Volunteer catechists** — non-technical, on a phone, standing up in a parish hall, often
  with no signal. They do one thing: take attendance for a class of 14–22 children.
- **The coordination** — a priest or lay coordinator at a desk, working seven modules:
  enrolments, classes, students, catechists, school years, calendar, reports.

**Primary surfaces.**

| Surface | Audience | What happens there |
|---|---|---|
| Attendance sheet | Catechist, phone | The core interaction: search, mark present/absent, confirm. Works offline. |
| Catechist dashboard | Catechist | Next class, sync-queue state, per-class attendance meters |
| Public enrolment | Parents | 13 fields in 4 steps, review, protocol number |
| Auth (login / first access) | Both | Credential gate; forced password change on first login |
| Coordination console | Coordinator, desktop | Seven modules behind a persistent sidebar, with a review drawer for approving or rejecting enrolments |

**Core capabilities the design has to carry.** The product provides offline-first attendance
with a visible sync queue; enrolment review with allocation to a class; a liturgical calendar
that gates which days attendance can be opened; and attendance reporting per class and per
student. Every one of those features is built for a phone first and a desk second.

**What that produces visually.** A cool near-white canvas, one teal that means both *action*
and *present*, liturgical gold rationed to holy days and renewals, a single serif reserved
entirely for the coat of arms, 44px touch floors throughout, and 15px body type so a full
class roster fits one phone screen. The interface reads as a tool; the *mark* carries the
institution.

---

## Start here

| # | Open this | Why |
|---|---|---|
| 1 | [`preview/index.html`](preview/index.html) | The review launcher — all ten cards, linked and described |
| 2 | [`preview/colors-primary.html`](preview/colors-primary.html) | The six core tokens and the accent's dual meaning |
| 3 | [`preview/applied-surfaces.html`](preview/applied-surfaces.html) | The ten preserved source screens, live in frames |
| 4 | [`ui_kits/app/index.html`](ui_kits/app/index.html) | The applied kit — real product surfaces you can lift |

Then read [`DESIGN.md`](DESIGN.md) end to end. §9 (anti-patterns) is the fastest way to
judge whether new output belongs to this system.

---

## Review workflow

1. Open `preview/index.html` and walk the six foundation cards in order — colour, states,
   type, spacing, shape. Each prints live values, so what you inspect is what ships.
2. Open `preview/brand-assets.html`. It loads the real SVGs from `assets/` and `build/`;
   if any mark fails to render, a file is missing.
3. Open `preview/applied-surfaces.html` and interact *inside* the frames — mark students on
   the attendance sheet, open the review drawer in the admin console.
4. Read `context/provenance.md` to see which source file backs each rule, plus the one
   known drift and the declared gaps.

## Reuse workflow

1. Read `SKILL.md` — it is the agent-facing build guide.
2. Load `assets/catequese-ds.css`, or the two portable token files `colors_and_type.css`
   and `tokens.css` when carrying the language into another codebase.
3. Pick a shell: `.auth`, `.appbar`, or `.shell`.
4. Copy the skeleton of the closest surface in `ui_kits/app/` and swap the content.
   For React, import the primitives in `ui_kits/app/components/`.
5. Run the checklist at the end of `SKILL.md`.

---

## Using it

### The short path

```html
<link rel="stylesheet" href="assets/catequese-ds.css" />
```

`catequese-ds.css` is the **complete, unmodified source stylesheet** — tokens plus every
component (buttons, chips, fields, tables, meters, banners, drawer, three shells).
For anything inside this product, use it directly. Nothing else is needed.

### The portable path

To carry the language into another product or another framework, take the two token files:

```html
<link rel="stylesheet" href="colors_and_type.css" />  <!-- load first: shadows mix from --fg -->
<link rel="stylesheet" href="tokens.css" />
```

- [`colors_and_type.css`](colors_and_type.css) — the core six, accent/gold/state derivatives,
  four font stacks, the type scale, and the type role classes (`.display`, `.eyebrow`,
  `.lead`, `.meta`, `.num`, `.wordmark`).
- [`tokens.css`](tokens.css) — radius, spacing, elevation, layout widths, motion durations,
  the 44px touch floor, focus ring, and the reduced-motion guard.

Porting to Tailwind, CSS-in-JS or design tokens? Map these `:root` values across
**verbatim** and keep the names — the source's own stated next step was exactly this.

### The one rule

**No colour literal outside `:root`.** Every colour in a component rule is a token or a
`color-mix()` of tokens. This is what holds the system together across seven screens, and
the source explicitly names raw inline hex as the defect the redesign was fixing.

---

## Package contents

```
DESIGN.md                  The system: context, colour, type, spacing, layout,
                           components, motion, voice, anti-patterns
SKILL.md                   Agent-facing build instructions and checklist
README.md                  This file
colors_and_type.css        Portable colour + type foundations
tokens.css                 Portable shape, space, elevation, motion

assets/
  catequese-ds.css         ★ The full source stylesheet (25KB, verbatim)
  brasao.svg               Coat of arms, light backgrounds
  brasao-claro.svg         Coat of arms, dark/full-ink backgrounds
  favicon.svg              Reduced form — no fillet, thicker straight cross
  app-icon.svg             512×512 maskable PWA icon

build/
  icon-512.svg             Runtime icon, maskable
  icon-192.svg             Runtime icon, maskable
  icon-monochrome.svg      Single-colour form for tray / notification badges
  favicon-32.svg           Reduced form at browser-tab size
  manifest.webmanifest     Web app manifest wiring the runtime icons

preview/
  preview.css              Review-card chrome (not part of the system)
  index.html               ★ Review launcher
  colors-primary.html      Core six, accent derivatives, gold, ink pairs
  colors-states.html       State triads, chips, banners, row washes
  typography-specimens.html  Full scale, the serif exception, the numeric rule
  spacing-tokens.html      4px scale measured, stack helpers, the 44px floor
  layout-and-shape.html    Radius ladder, elevation, the three shells, breakpoints
  components-buttons.html  Every variant, size, state, and the anatomy table
  components-forms.html    Fields, validation, choice tiles, stepper, segmented
  components-data.html     Tables, stats, meters, bars, calendar, drawer, empty
  brand-assets.html        ★ Loads the real SVGs — construction, reduction, runtime
  applied-surfaces.html    ★ The ten source screens live in frames

ui_kits/app/
  index.html               Kit overview and inventory
  README.md                How to reuse the kit
  attendance-sheet.html    The signature surface, fully interactive
  shell-catechist.html     Appbar shell — dashboard with sync state
  shell-admin.html         Sidebar console — enrolments + review drawer
  shell-auth.html          Split auth — login and first access in one file
  components.html          Component beside its markup, ready to copy
  components/              React primitives for the sspx-catechism codebase
    Button.jsx             + the counting ConfirmAttendanceButton
    Chip.jsx               + NetworkChip, AttendanceChip
    AttendanceRow.jsx      The segmented control + tallyMarks()
    Field.jsx              Field, TextField, SelectField, ChoiceGroup, SearchField
    Sidebar.jsx            Console navigation + the Shell grid
    ReviewDrawer.jsx       Drawer, Facts, rejection validation
    Metrics.jsx            Stat, Meter, Bars, ProgressRail

context/
  source-context.md        Original handoff manifest
  provenance.md            ★ File-by-file evidence trail + known drift

*.html (root)              The ten preserved source screens, unmodified
```

Files marked ★ are the ones a reviewer should open first.

---

## Preview manifest

Ten focused cards, each isolating one dimension. Launcher: **[`preview/index.html`](preview/index.html)**.

| # | Card | Dimension | What it shows |
|---|---|---|---|
| 01 | [`colors-primary.html`](preview/colors-primary.html) | Colour | The eight-tone palette strip, the core six, accent derivatives, liturgical gold, and the ink/ground pairs at real body size. **Values are read from `getComputedStyle` at runtime**, so the card cannot drift from the stylesheet. |
| 02 | [`colors-states.html`](preview/colors-states.html) | Colour | The three state triads (base / soft / ink), all chip variants, all four banners, and the 4–5% row wash that replaces state-filled cards. |
| 03 | [`typography-specimens.html`](preview/typography-specimens.html) | Type | The four stacks, the seven-step scale, the serif exception argued in full, and a side-by-side proof of why every number needs `.num`. |
| 04 | [`spacing-tokens.html`](preview/spacing-tokens.html) | Spacing | The 4px scale drawn at true width, the three stack helpers, the 44px touch floor measured against every control size, and real list/table density. |
| 05 | [`layout-and-shape.html`](preview/layout-and-shape.html) | Shape & layout | The radius ladder, what each elevation level means, diagrams of the three shells, and every breakpoint. |
| 06 | [`brand-assets.html`](preview/brand-assets.html) ★ | Brand | **Loads the real SVGs from `assets/` and `build/`.** Construction, the light/dark pair, the reduced form, inversion over ink, the reduction test, and the runtime icon set. |
| 07 | [`components-buttons.html`](preview/components-buttons.html) | Components | Four variants, five sizes with measured heights, the anatomy table, the counting-label rule shown against its anti-pattern, and the three async states — all clickable. |
| 08 | [`components-forms.html`](preview/components-forms.html) | Components | Fields and validation, choice tiles, the attendance segmented control with live tally, the stepper, and additive password rules. Fully interactive. |
| 09 | [`components-data.html`](preview/components-data.html) | Components | Tables, stat tiles, meters, filled bar charts, the liturgical calendar, the review drawer, and empty states with next steps. |
| 10 | [`applied-surfaces.html`](preview/applied-surfaces.html) ★ | Applied | **The ten preserved source screens running live in frames**, each with a note on what to watch. Doubles as the package integrity check — a blank frame means a missing file. |

Cards 06 and 10 load preserved files rather than reconstructions, so they verify the package
as well as document it.

---

## Preserved source

The seven original screens stay at the project root, **working and unmodified**, because
they are both the evidence for this system and its best worked examples:

| File | Surface |
|---|---|
| `index.html` | Proposal overview — screen index and the before/after argument |
| `design-system.html` | The source's own system documentation |
| `logo.html` | Full brand manual — three mark directions, reduction tests, lock-ups |
| `logo-v1-moderno.html` | Earlier mark round, kept for the rationale it records |
| `login.html` | Split auth |
| `trocar-senha.html` | First access, live password rules |
| `inscricao.html` | 4-step public enrolment with review and protocol |
| `dashboard-catequista.html` | Catechist home, sync queue, class cards |
| `chamada.html` | Attendance sheet — the product's core interaction |
| `admin.html` | Seven-module coordination console with review drawer |

They resolve `assets/catequese-ds.css` by relative path, so they must stay at the root to
keep rendering. `preview/applied-surfaces.html` frames them from `../`.

---

## Notes and limits

- **No `fonts/` directory, deliberately.** The system loads no webfont — all four stacks
  resolve to system faces. See `DESIGN.md` §3.
- **Runtime icons are SVG.** The source shipped vector only; `build/` derives sized and
  monochrome SVG variants plus a manifest. No raster PNG set exists in the evidence, so
  none was invented — generate them from `build/icon-512.svg` if a platform needs raster.
- **One drift found in the evidence,** between the source's swatch captions and its actual
  CSS values for `--gold` and `--warn`. The CSS wins, because it is what renders. Recorded
  in [`context/provenance.md`](context/provenance.md).
- **Demo data is demo data.** Names, tallies and dates in the preserved screens and the UI
  kit are the source's own fixtures, labelled *"dados de demonstração"* wherever shown.
