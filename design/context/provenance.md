# Provenance — where every claim came from

Design system `user:catechism-design-system`, extracted from Open Design project
**Catechism** (`da2f6d22-b8b8-4038-9e5f-ad6f163d3220`), kind `prototype`, linked to
`/Users/renansantos/Projects/rmtech/sspx-catechism`.

Fifteen files were copied. **All fifteen were read in full or in substantial part before
anything was generated.** Nothing in `DESIGN.md`, `SKILL.md`, `colors_and_type.css` or
`tokens.css` is invented; each item below names the file it came from.

---

## Evidence by file

### `assets/catequese-ds.css` — 25KB · the primary source
The single highest-signal artifact. A complete, disciplined design system: a `:root` with
the core six, accent/gold/state derivatives, four font stacks, an 8-step spacing scale, a
5-step radius ladder, 3 shadows and a 7-step type scale — followed by every component in
the product. Its own header comment states the governing rule: *"Nenhuma cor fora deste
bloco `:root`."*

**Extracted into:** all of `colors_and_type.css`, all of `tokens.css`, `DESIGN.md` §2–§7.
**Preserved:** verbatim at `assets/catequese-ds.css`. Never edited.

Component rules read and documented: `.btn` (+ 4 variants, 4 sizes), `.card` / `.card-flush`
/ `.card-link` / `.card-accent`, `.panel-head|body|foot`, `.chip` (+6), `.field` /
`.input` / `.select` / `.textarea` / `.choice`, `.seg` / `.seg-btn`, `.list` / `.list-row`
/ `.avatar`, `.table` (+ `.num-col`, `.act-col`), `.stat` / `.meter` / `.bars`,
`.banner` (+4), `.empty`, `.appbar` / `.shell` / `.sidebar` / `.nav-item` / `.workarea`,
`.actionbar`, `.stepper` / `.step`, `.drawer`, `.kv`, `.auth` / `.auth-aside`,
`.brand` / `.mark` / `.wordmark` / `.dot-grid`, and 4 responsive breakpoints
(1024 / 860 / 720 / reduced-motion).

### `design-system.html` — 21KB · the source's own system doc
Named the direction (**"Human / approachable"**), the audience rationale, the colour
do/don't list, the type specimen table, the numeric rule, and a "rules the system does not
give up" block (touch 44px, radius ladder, elevation-means-clickable, 4px grid, 140–220ms,
focus ring, empty states, permanent offline chip).

**Extracted into:** `DESIGN.md` §1, §2 (rules), §3, §4, §7. **Preserved** at root.

### `index.html` — 19KB · proposal overview
Screen index with the seven routes and, critically, a **before/after table** naming the
defects the system was built to fix: only two shared components existed (`button.tsx`,
`card.tsx`), the rest was loose Tailwind with **raw hex inlined for green and red**;
network state rendered as unweighted plain text; the attendance list had no search, no
progress and an unexplained disabled button; the enrolment form was a single 13-field wall.

**Extracted into:** `DESIGN.md` §1 (the offline thesis), §9 anti-patterns 1, 5, 7.
**Preserved** at root.

### `chamada.html` — 9KB · the attendance sheet
The product's core interaction, fully implemented. Source of: the `.seg-btn` behaviour with
**no hidden neutral default**, the running present/absent/unmarked counts, the sticky
progress rail, the `Faltam N` disabled-button label, "marcar todos presentes", live
name search with a worded empty state, and the offline save path.

**Extracted into:** `DESIGN.md` §6 (segmented control, buttons), §8 (voice), §9 (5, 8).
**Preserved** at root · **reworked into** `ui_kits/app/attendance-sheet.html`.

### `admin.html` — 37KB · the coordination console
Seven modules behind a persistent sidebar with a pending-count gold badge, plus the
enrolment review **drawer** (approve-and-allocate / reject-with-reason), stat rows, filter
toolbars, the calendar grid with gold holy days, and the `.bars` attendance chart with a
full `aria-label`.

**Extracted into:** `DESIGN.md` §5 (shell, drawer), §6 (tables, metrics, charts), §9 (9, 10, 12).
**Preserved** at root · **reworked into** `ui_kits/app/shell-admin.html`.

### `dashboard-catequista.html` — 11KB · catechist home
The sync-queue banner with an inline action, the permanent `navigator.onLine` chip, the
hero "next attendance" card at `--r-xl`, class cards with meters, and the phone-only
sticky `.actionbar`.

**Extracted into:** `DESIGN.md` §1, §5 (appbar shell), §6 (banners, metrics), §8.
**Preserved** at root · **reworked into** `ui_kits/app/shell-catechist.html`.

### `login.html` + `trocar-senha.html` — 6KB each · auth pair
The `.auth` split, the full-ink aside with mark + `.display` promise + `.dot-grid`, the
392px card, and — in `trocar-senha.html` — the additive live password rules
(`aria-live="polite"`, outline circle → check as each rule is met).

**Extracted into:** `DESIGN.md` §5 (auth shell), §7 (live validation).
**Preserved** at root · **reworked into** `ui_kits/app/shell-auth.html`.

### `inscricao.html` — 14KB · public enrolment
Four-step `.stepper` over the same 13 fields, per-step validation with focus management,
a `.kv` review pane built from `FormData`, and a success view with a gold protocol chip.
Also the source of the teaching-placeholder pattern.

**Extracted into:** `DESIGN.md` §6 (stepper, fields), §8 (placeholders, errors).
**Preserved** at root.

### `logo.html` — 36KB · the brand manual
Three mark directions (Selo / Brasão / Monograma) each with construction geometry,
reduction tests at 48/32/24/20/16px, dark and monochrome plates, and a verdict. Contains
the decisive typographic argument: *the geometric sans says "tool", the small-caps serif at
0.17em says "institution" — only the mark changes voice*, and the explicit statement that
`--font-logo` is the product's single declared serif exception.

**Extracted into:** `DESIGN.md` §3 (serif exception), §6 (brand assets, reduction floor).
**Preserved** at root.

### `logo-v1-moderno.html` — 28KB · earlier mark round
Superseded exploration, kept because `logo.html` argues explicitly against it (repertoire,
ink, letter). Retained as rationale, not as an active brand asset.
**Preserved** at root.

### `assets/brasao.svg`, `brasao-claro.svg`, `favicon.svg`, `app-icon.svg`
Real brand files, with commented rationale inside each. `brasao` / `brasao-claro` are the
light/dark pair; `favicon.svg` documents the **reduced form** (fillet dropped because it
becomes dirt at 16px; cross switched to straight arms 38% thicker so it doesn't close up);
`app-icon.svg` is a 512×512 maskable PWA icon with the mark at 64% of the square.

Each file carries literal `oklch()` values with a comment noting they mirror the tokens and
must be updated by hand if the tokens change — because an externally-loaded SVG cannot see
the document's custom properties.

**Extracted into:** `DESIGN.md` §6 (brand assets). **Preserved** in `assets/`
· **derived into** `build/` runtime icons · **displayed live** in `preview/brand-assets.html`.

### `context/source-context.md`
The handoff manifest. Read first, as instructed.

---

## Generated in this package

| File | Basis |
|---|---|
| `DESIGN.md` | All fifteen source files |
| `colors_and_type.css` | `catequese-ds.css` `:root` + type roles, verbatim values, commented |
| `tokens.css` | `catequese-ds.css` `:root` shape/space/shadow + layout constants |
| `README.md`, `SKILL.md` | Synthesis of the above |
| `preview/*.html` (10 files) | Composed from tokens; `brand-assets` and `applied-surfaces` load real preserved files |
| `ui_kits/app/*` (6 files) | Reworked from `chamada`, `dashboard-catequista`, `admin`, `login` |
| `build/*` | Derived from `assets/app-icon.svg` and `assets/favicon.svg` |

---

## Known drift in the evidence

**One inconsistency was found and resolved in favour of the CSS**, which is what actually
renders:

| Token | `design-system.html` swatch caption | `catequese-ds.css` (authoritative) |
|---|---|---|
| `--gold` | `oklch(74% 0.12 78)` | **`oklch(82% 0.135 95)`** |
| `--warn` | `oklch(72% 0.14 70)` | **`oklch(69% 0.16 48)`** |

The captions in the source's documentation page were hand-written and drifted from the
stylesheet they document; the swatch *chips* on that same page correctly render
`var(--gold)` / `var(--warn)`, so only the printed text was stale. This package uses the
CSS values everywhere, and `preview/colors-primary.html` prints them from
`getComputedStyle` rather than by hand so the drift cannot recur.

---

## Gaps — declared, not filled

Recorded honestly rather than invented:

- **No raster icons.** The source ships vector only. `build/` therefore contains sized and
  monochrome **SVG** variants plus a manifest; no PNG set was fabricated. Generate raster
  from `build/icon-512.svg` if a target platform requires it.
- **No font files, by design.** All four stacks resolve to system faces (`DESIGN.md` §3).
  There is no `fonts/` directory and there should not be one.
- **No photography or illustration.** The source uses none; its only graphic devices are
  the coat of arms, the `.dot-grid` calendar motif and stroked 24-viewBox icons. Adding
  imagery would contradict `DESIGN.md` §9.13.
- **Dark mode is not defined.** The source has full-ink *surfaces* (`.auth-aside`,
  `.on-ink`) but no dark colour scheme. Any dark theme would be new design work, not
  extraction.
- **Demo data throughout.** Student names, tallies, dates and protocol numbers are the
  source's own fixtures, labelled *"dados de demonstração"* wherever they surface.
