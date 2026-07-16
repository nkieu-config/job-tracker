# Design system

Job Tracker's visual language: a deep aubergine primary, a Geist Sans / Geist
Mono pair where the mono tier is load-bearing, a tight radius scale with no
pills, and depth carried by hairline borders rather than shadows or gradients.

Two files are the source of truth, and everything below points at one of them:

- [`src/app/globals.css`](../src/app/globals.css) — the palette (light and
  dark), the Tailwind v4 `@theme` block (color, font, radius and type tokens),
  the `@utility` classes for display type, the focus ring, and the entrance
  animation.
- [`src/components/ui/`](../src/components/ui/) — the shared class helpers and
  primitives that keep buttons, badges, indicators, forms, status colors and
  deadline tones consistent across screens.

The system started as an adaptation of a Slack-inspired marketing language and
has since been rebuilt around a denser, more instrument-like direction. What was
kept, what was thrown out, and why is recorded under
[Deliberate departures](#deliberate-departures) and [Provenance](#provenance).

## Overview

The system centers on a deep aubergine (`--color-primary` `#4a154b`) — the
filled button, the wordmark, the one accent. Everything around it is a neutral
biased toward that aubergine: the greys carry a red/purple undertone rather than
being pure, so the accent reads as part of the palette instead of dropped onto
it.

Typography is a **pair**, not a family: **Geist Sans** for everything a person
reads, **Geist Mono** for everything a machine produced. Dates, percentages,
counts, token totals, latencies and file names are set in mono — so a column of
values lines up and reads as data at a glance, without a label saying so.

Buttons are `rounded-lg` (7px). Cards are `rounded-2xl` (12px). Nothing is a
pill. Regions are separated by 1px hairlines and, in dark mode, by a genuine
surface step — not by shadows.

### Key characteristics

- **Single aubergine accent** reused across filled buttons, the wordmark and the
  active nav item. Blue (`--color-link-blue`) is the only chromatic departure in
  body type, reserved for inline links.
- **Sans/mono pair as an information channel.** Mono is not decoration — it
  marks a value as machine-produced and comparable.
- **A tight radius scale** (4–12px) assigned by role. The 90px pill is gone.
- **Borders, not shadows.** A hairline defines a card; shadow is reserved for
  things that genuinely float (drag overlay, dialogs, the landing product panel).
- **Indicators are dots, not filled pills.** Status and fit read as a small
  colored dot beside neutral text, so a dense list isn't a wall of tinted chips.
- **Dark mode is first-class**, not an inversion — see [Dark mode](#dark-mode).
- **A separate categorical status palette** for the pipeline — the one
  deliberate break from the single-accent rule, explained below.

## Color

Every token here is a `--color-*` custom property in the `@theme` block, fed by
a raw custom property that the dark palette redefines.

### Brand & accent

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-primary` | `#4a154b` | `#8a4d93` | Filled buttons, wordmark, active nav, accent text |
| `--color-primary-press` | `#611f69` | `#9a5aa3` | Hover/pressed state of the primary button |
| `--color-on-primary` | `#ffffff` | `#ffffff` | Text on aubergine fills |
| `--color-link-blue` | `#1264a3` | `#7cb8ef` | Inline links |
| `--color-link-hover` | `#3860be` | `#9dccf4` | Link hover |

The dark primary is lightened to `#8a4d93` so white label text still clears
4.5:1 on a filled button while the same token stays legible as accent text on a
near-black page.

### Surface

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-canvas` | `#ffffff` | `#1d1722` | Card and content surface |
| `--color-canvas-lavender` | `#f4f0f5` | `#141017` | The page beneath the cards; secondary-button fill; board troughs |
| `--color-canvas-lavender-hover` | `#ece6ef` | `#252030` | Secondary-surface and drop-target hover |
| `--color-canvas-error` | `#fdf0f0` | `#2b1a1e` | Error surface |
| `--color-surface-hover` | `#f5eded` | `#252030` | Hover on neutral surfaces |
| `--color-hairline` | `#e5dde9` | `#39323f` | 1px borders and dividers — the workhorse |

> [!IMPORTANT]
> **`--color-canvas-lavender` inverts its relationship to `--color-canvas`
> between themes.** On light it is *darker* than the card (paper under white
> cards); on dark it is *darker still* than the card (`#141017` page under
> `#1d1722` cards). So a chip filled with `canvas-lavender` lifts off a white
> page but sinks into a dark one. Anything that must read as raised on both
> themes should tint with the accent (`bg-primary/15`) instead — this is exactly
> the bug that hid the landing's feature-icon chips in dark mode.

### Text

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-ink` | `#221a26` | `#e8e5ee` | Body text; also the focus ring |
| `--color-ink-mute` | `#5f5566` | `#a49eae` | Secondary text, captions, column headers |

The light ink is `#221a26`, not a neutral near-black: it carries the same
aubergine bias as the rest of the greys.

### Semantic

Status feedback, never decoration. Each pairs a foreground with a tint.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-semantic-error` | `#bd3a12` | `#f08a6c` | Form errors, overdue deadlines, destructive actions |
| `--color-semantic-error-tint` | `#fdebea` | `#3a1e1a` | Error background |
| `--color-semantic-error-hover` | `#fad8d6` | `#4c2820` | Error-surface hover |
| `--color-semantic-error-solid` | `#bd3a12` | `#c0442a` | Filled destructive button |
| `--color-semantic-success` | `#007a5a` | `#4cbf95` | Success, strong fit |
| `--color-semantic-success-tint` | `#e2f1ea` | `#17302a` | Success background |
| `--color-semantic-warning` | `#8a6500` | `#e6b23c` | Warnings, near deadlines, moderate fit |
| `--color-semantic-warning-tint` | `#fcf2db` | `#342a17` | Warning background |

The light warning is a dark amber (`#8a6500`) rather than a bright one: it has
to clear 4.5:1 as 12–13px text, and badge text is never "large text".

### Pipeline status — a categorical scale

The five pipeline stages need colors that read as *different*, not as *more or
less branded*, so they come from Tailwind's palette rather than the aubergine
system. `STATUS_COLORS` in
[`src/components/ui/status-colors.ts`](../src/components/ui/status-colors.ts) is
the single source: one entry per status, each supplying the surfaces that status
can appear on (`badge`, `dot`, `fill`, `num`, `seg`), each with a dark variant.

| Status | Hue | Reads as |
| --- | --- | --- |
| `SAVED` | zinc | Not yet acted on |
| `APPLIED` | blue | In flight |
| `INTERVIEW` | amber | Live, needs attention |
| `OFFER` | green | Won |
| `REJECTED` | red | Closed |

This is the system's one sanctioned break from the single-accent rule — see
[Deliberate departures](#deliberate-departures).

### Dark mode

Dark is a **redefinition of the raw custom properties**, not a set of `dark:`
overrides scattered through components. Three pieces make it work:

1. **Token indirection.** `@theme inline` maps `--color-*` to `var(--*)` rather
   than to literal hex. This matters: with a literal value, Tailwind bakes it
   into the generated utility and no amount of re-declaring can flip it. The
   indirection is what lets one palette swap repaint the app.
2. **A `dark` variant that honours both signals.** `@custom-variant dark` matches
   `[data-theme="dark"]` *or* `prefers-color-scheme: dark` when no explicit theme
   is set, so the OS preference works out of the box and the in-app toggle wins
   when used.
3. **A pre-paint script** in [`layout.tsx`](../src/app/layout.tsx) reads the
   stored theme and stamps `data-theme` before first paint, so there is no flash.

Components almost never carry a `dark:` class; they reference tokens and the
palette does the rest. The exception is `STATUS_COLORS`, which uses Tailwind
palette classes and therefore spells its dark variants out.

## Typography

Two families, loaded by `next/font` in
[`src/app/layout.tsx`](../src/app/layout.tsx) via the `geist` package:
**Geist Sans** (`--font-geist-sans` → `--font-sans`) and **Geist Mono**
(`--font-geist-mono` → `--font-mono`), each falling back to the system stack.

### Display tier

Implemented as `@utility` classes in `globals.css`, not as `@theme` variables —
each bundles size, weight, leading and tracking so a headline can never be set
at default tracking by accident.

| Utility | Size | Weight | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `font-display-lg` | 50px | 700 | 1.12 | -0.6px | Landing hero headline |
| `font-display-md` | 32px | 700 | 1.25 | -0.256px | Page and section titles — the workhorse |
| `font-display-sm` | 24px | 700 | 1.25 | -0.192px | Compact titles, landing statistics |

### UI tier

`--text-*` tokens in the `@theme` block. Denser than a marketing scale, because
app chrome carries more information per screen than a landing page does.

| Token | Size | Use |
| --- | --- | --- |
| `--text-title` | 18px | Section titles |
| `--text-body-lg` | 16px | Emphasized body, form fields and labels |
| `--text-body` | 14px | Default UI body |
| `--text-caption` | 13px | Helper text, captions, status labels |
| `--text-fine` | 12px | Fine print, all-caps column headers |

### Mono tier

Mono has **no size scale of its own** — it borrows the UI tier and is applied
with `font-mono`. It is a channel, not a hierarchy.

Set in mono:

| Where | Example |
| --- | --- |
| Dates and deadlines | `Jul 27, 2026` |
| Percentages and scores | `82%`, `5/6 matched` |
| Counts in column headers | the `3` beside **Saved** |
| Dashboard statistics | `63%`, `250+` |
| AI telemetry | tokens, latency, cost |
| Identifiers and filenames | `resume_backend_v3.pdf`, an error `digest` |

Not set in mono: prose, labels, headings, button text. `Added` stays sans while
the date beside it goes mono — the word is prose, the value is data.

Pair `tabular-nums` with mono wherever values stack in a column.

### Principles

- **Tight tracking on display.** Negative letter-spacing across 24–50px.
  Without it the headlines read loose and unedited.
- **Mono means "measured".** If a human wrote it, it's sans. If the system
  computed it, it's mono.
- **Reach for a `--text-*` token,** never `text-sm` / `text-xs`, so a change to
  the scale reaches every surface.

## Layout & spacing

- **Scale.** Tailwind's default 4px scale. The app defines no spacing tokens;
  consistency comes from reusing the component patterns below.
- **Card padding.** `p-8` (32px) on standard cards; `p-6` (24px) on compact ones.
- **Section rhythm.** The landing bands run `py-16 md:py-24`; the application
  detail page separates its sections with `divide-y divide-hairline` and `py-8`
  rather than wrapping each in a card.
- **Board columns.** `w-full` stacked below `lg`, `w-60` side by side from `lg`.

## Elevation & depth

Depth is carried by a border first, a surface step second, and a shadow only
when something genuinely floats.

| Level | Treatment | Use |
| --- | --- | --- |
| 0 | Flat, on `canvas-lavender` | The page itself |
| 1 | `border border-hairline` + `bg-canvas` | Cards, rows, panels — the default |
| 2 | `shadow-[0_20px_60px_rgba(74,21,75,0.10)]` | The landing's product panel and fit console |
| 3 | `shadow-[0_10px_30px_rgba(74,21,75,0.2)]` / `shadow-lg` | Drag overlay, dialogs — things actually lifted off the page |

In dark mode the border does less work and the surface step does more: the page
is `#141017` and a card is `#1d1722`, so cards read as raised even where a
hairline is nearly invisible.

## Shape

The radius scale is redefined in `@theme`, overriding Tailwind's defaults, and
assigned by role. There is no pill token.

| Class | Radius | Role |
| --- | --- | --- |
| `rounded-sm` | 4px | Form inputs |
| `rounded-md` | 6px | Badges, filter chips, the segmented control's inner segment, logo tiles, icon-only affordances |
| `rounded-lg` | 7px | **Buttons**, banners, icon chips, compact cards, the segmented control's shell |
| `rounded-xl` | 9px | Board cards and troughs, the rejected strip, fit rows, unlock boxes |
| `rounded-2xl` | 12px | Standard cards, the list-table container, landing panels |
| `rounded-full` | ∞ | Dots, progress-bar and funnel fills — things that are actually round |

Two clarifications the table can't carry:

- **Nesting steps down.** A segmented control is `rounded-lg` outside with
  `rounded-md` segments inside; the rejected strip is `rounded-xl` with
  `rounded-lg` cards. An inner radius always sits one step below its container.
- **`rounded-full` is for geometry, not for style.** A status dot is round
  because it's a dot. Nothing with a text label is round any more.

## Motion

- `--animate-rise` — 0.5s `cubic-bezier(0.22, 1, 0.36, 1)`: fade in while
  translating up 10px. Used by the dashboard's pipeline cards.
- `.reveal` — a scroll-triggered fade/translate used on the landing only, driven
  by an `IntersectionObserver` in
  [`reveal.tsx`](../src/components/ui/reveal.tsx). The component **opts out
  entirely** under `prefers-reduced-motion: reduce` — it never sets the hidden
  state, so content is visible immediately rather than animating quickly.
- A global `prefers-reduced-motion` rule flattens every animation, transition and
  smooth scroll.

## Components

### Buttons

`buttonClass` / `Button` in [`button.tsx`](../src/components/ui/button.tsx) is
the only place a button is styled.

```text
inline-flex items-center justify-center gap-2 rounded-lg font-sans font-bold
whitespace-nowrap transition-colors disabled:opacity-60
```

| Variant | Treatment |
| --- | --- |
| `primary` | `bg-primary text-on-primary hover:bg-primary-press` — the filled CTA |
| `secondary` | `bg-canvas-lavender text-ink hover:bg-canvas-lavender-hover` |
| `outline` | `bg-canvas text-primary border-2 border-primary` |
| `ghost` | `bg-canvas text-ink border border-hairline` |
| `danger` | `bg-semantic-error-tint text-semantic-error` |
| `danger-solid` | `bg-semantic-error-solid text-on-primary` |

| Size | Padding | Type |
| --- | --- | --- |
| `sm` | `py-2 px-4` | `--text-body` |
| `md` | `py-2.5 px-5` | `--text-body`, `tracking-[0.144px]` |
| `lg` | `py-3.5 px-7` | `--text-body-lg`, `tracking-[0.2px]` |

`md` and `lg` land at ~42px and ~52px tall — see
[Touch targets](#responsive-behavior).

### Cards

- **Standard** — `cardClass`: `rounded-2xl border border-hairline bg-canvas`.
  Padding is passed in by the caller, usually `p-8`.
- **Empty state** — the same shape with `border-dashed`, an optional icon, title,
  body and a CTA slot ([`empty-state.tsx`](../src/components/ui/empty-state.tsx)).

### Inputs

`inputClass` in
[`src/components/ui/form-styles.ts`](../src/components/ui/form-styles.ts) is the
only place a field is styled:

```text
rounded-sm border border-hairline bg-canvas px-3 py-2.5 text-body-lg
font-normal text-ink outline-none focus:border-primary focus:ring-1
focus:ring-primary transition-colors
```

`labelClass` pairs with it. Every form in the app imports both — a field styled
by hand is a bug.

### Inline message banner

One shape for every inline message — auth errors, form validation, the upload
failure, the stale-analysis warning:

```text
rounded-lg px-3 py-2 text-caption font-medium
```

The surface picks the meaning: `bg-canvas-error` / `--color-semantic-error` for
failures, `bg-semantic-warning-tint` for warnings, `bg-canvas-lavender` for
neutral status. Errors carry `role="alert"`, status messages `role="status"`.

### Indicators — dots, not pills

The system's signature move. A tinted pill per row turns a dense list into
confetti, so state is carried by a 6px dot beside neutral text.

- **`Dot`** ([`badge.tsx`](../src/components/ui/badge.tsx)) —
  `inline-block size-1.5 shrink-0 rounded-full`, coloured by tone
  (`neutral` / `primary` / `success` / `warning` / `error`). Always
  `aria-hidden`: it is never the only carrier of meaning.
- **`StatusBadge`** ([`status-badge.tsx`](../src/components/applications/status-badge.tsx))
  — a `STATUS_COLORS` dot plus the status label in `--color-ink`. The colour
  identifies, the text says it out loud.
- **Fit** — a `Dot` toned by `fitBand()` plus the score in mono
  (`● 82%`). Band and number travel together.

**`Badge`** still exists for genuine tags — skill chips, "Best fit" — as
`rounded-md` `font-medium` with a tint. It is no longer a pill and no longer
carries status.

### Deadline tone

Urgency is honest or it is noise. `deadlineTone()` in
[`format.ts`](../src/lib/format.ts) buckets a date, and
[`deadline.ts`](../src/components/ui/deadline.ts) maps it to one class:

| Tone | When | Treatment |
| --- | --- | --- |
| `overdue` | before today | `text-semantic-error font-semibold` |
| `soon` | within 3 days | `text-semantic-warning` |
| `upcoming` | later | `text-ink-mute` |

Every deadline in the app — board card, list column, detail rail, dashboard —
imports this map, so a date can't be red on one screen and grey on another. A
date that is merely *present* is never coloured.

### Segmented control & filter chips

[`segmented-control.tsx`](../src/components/ui/segmented-control.tsx): a
`rounded-lg` shell with `p-0.5` and `rounded-md` segments; the active segment
takes the aubergine fill, the rest are `--color-ink-mute`. `filterChipClass`
follows the same logic standalone.

### Links

`--color-link-blue`, underlined on hover — the only chromatic departure from
aubergine in body type. Resume labels, job URLs and the demo links all use it.

### Focus ring

A system-wide rule in `globals.css`:

```css
:focus-visible:not(input):not(textarea):not(select) {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px var(--color-canvas);
}
```

A `currentColor` ring would be white-on-white on the aubergine-filled buttons.
An ink ring separated from the element by a canvas halo stays visible on light
surfaces, aubergine ones and dark mode alike.

## Responsive behavior

Tailwind's default breakpoints. The three patterns that matter:

- **The board becomes an accordion.** Below `lg` the columns stack full-width,
  each with a tappable header that collapses its cards; from `lg` they are
  side-by-side columns and the header is inert. Every section auto-expands while
  a card is being dragged, so a collapsed stage never stops being a drop target.
- **The list table keeps all three columns.** Below `sm` the status and deadline
  columns narrow (`84px` / `104px`) and the role truncates, rather than forcing a
  horizontal scroll that would push the deadline off-screen.
- **The detail page collapses its rail.** From `lg` it is a sticky facts +
  on-this-page rail beside the content; below that the facts stack on top and the
  scroll-spy nav hides — a phone scrolls one column instead.

Elsewhere: multi-column grids collapse to one, and paired buttons go full-width
(`w-full sm:w-auto`).

**Touch targets.** `size="md"` buttons land at ~42px and `size="lg"` at ~52px
tall, and form fields at ~44px — at or above the 44×44 CSS-pixel target of WCAG
2.5.5. Button padding is not a free parameter.

## Do's and Don'ts

### Do

- Reserve aubergine for filled buttons, the wordmark and the active nav item —
  one filled aubergine button per viewport.
- Set every machine-produced value in `font-mono` with `tabular-nums`.
- Set headlines with a `font-display-*` utility so tracking comes along with the
  size.
- Import `buttonClass`, `inputClass` / `labelClass`, `Dot` and
  `DEADLINE_TONE_CLASS` rather than restyling.
- Take pipeline colours from `STATUS_COLORS`, never by hand.
- Tint with `bg-primary/15` when a surface must read as raised in both themes.

### Don't

- Don't add a fourth colour family. Aubergine, link-blue, and the
  semantic/status scales are the whole system.
- Don't use aubergine for body text — it is a fill and accent colour.
- Don't reach for `rounded-full` on anything with a text label.
- Don't set prose in mono, or a computed value in sans.
- Don't colour a deadline by hand — bucket it with `deadlineTone()`.
- Don't fill a status pill where a dot will do.
- Don't assume `canvas-lavender` lifts: it inverts between themes (see
  [Surface](#surface)).
- Don't write a `dark:` class where a token would flip on its own.
- Don't reach for a shadow where a hairline border will do.

## Deliberate departures

Where the system diverges from the marketing language it started in. These are
choices, not drift:

| Departure | Why |
| --- | --- |
| **The 90px pill was removed entirely** | A marketing page has a handful of CTAs; this app has buttons, chips, segments and toggles on every screen. At that density, uniform pills stop reading as emphasis and start reading as a default — nothing has a stance. A 7px radius lets shape carry role again. |
| **A mono tier was added** | The original had one family. A tracker is mostly numbers — dates, scores, token counts — and a single family gives the reader no way to tell a computed value from a written one. Mono is the cheapest possible signal. |
| **The pastel-mesh gradient was dropped** | The gradient carried depth for a page with almost nothing on it. Behind a real board it fought the cards, and it has no honest dark-mode analogue. Hairlines and a surface step do the same job in both themes. |
| **Neutrals were biased toward the accent** | Pure greys made the aubergine look pasted on. Tinting the greys (`#221a26`, `#5f5566`, `#e5dde9`) makes one palette instead of an accent plus a stock grey ramp. |
| **Status pills became dots** | A tinted pill per row is fine on a marketing card and unreadable on a 12-row table. |
| **A categorical status palette** breaks the "never add a third accent" rule | Five pipeline stages must be *distinguishable*, not *branded*. Ranking them by how aubergine they are would encode a meaning the data doesn't have. Confined to `STATUS_COLORS`, so it can't leak into brand surfaces. |
| **Dark mode was added** as a palette swap rather than `dark:` classes | Scattering overrides through components makes the palette unknowable. Token indirection keeps one place to look. |
| **A focus-ring rule was added** | The source never contended with aubergine-filled buttons, where a `currentColor` ring disappears. |

## Provenance

This system began as an adaptation of a design-language study of a Slack-inspired
marketing site: the aubergine palette, the lavender canvases, the 90px pill, the
pastel-mesh gradient and the display-typography rules all came from there, with
**Inter** substituted for the study's two proprietary faces.

It has since been rebuilt. The marketing language was doing what it was designed
to do — sell on a page with three CTAs and a lot of air — and that is the wrong
job for a board, a table, and a detail page with six sections. What survived is
the aubergine and the display tier's tight tracking. What replaced the rest — the
Geist pair, the mono channel, the tight radius scale, border-led depth, dot
indicators, a real dark palette — is documented above.

Everything the app actually ships is listed here and lives in `globals.css` and
`src/components/ui/`. This document describes the system as built, not the study
it came from.

## Related docs

- [Architecture & design decisions](architecture.md)
- [Local setup & scripts](setup.md)
