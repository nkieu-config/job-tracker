# Design system

Job Tracker's visual language: a deep aubergine primary, a single blue link
accent, pill buttons at 90px radius, and pastel-mesh gradients that carry depth
without shadows.

Two files are the source of truth, and everything below points at one of them:

- [`src/app/globals.css`](../src/app/globals.css) — the Tailwind v4 `@theme`
  block (color and type tokens, the pill radius, the entrance animation) plus
  the `@utility` classes for display type and the pastel-mesh gradient.
- [`src/components/ui/`](../src/components/ui/) — the shared class helpers that
  keep forms and status colors consistent across screens.

The system was adapted from a design-language study of a Slack-inspired
marketing site; what was adopted, what was changed, and why is recorded under
[Deliberate departures](#deliberate-departures) and [Provenance](#provenance).

## Overview

The system centers on a deep aubergine (`--color-primary` `#4a154b`) — applied
as the dominant button fill, the closing band on the landing page, and the brand
wordmark. Around that aubergine sits a deliberately delicate ecosystem: cream and
lavender canvases, a pastel-mesh gradient wash behind the hero, and product UI
rendered on top of it rather than inside chrome.

Typography is one open-source family, Inter, split across two tiers: a **display
tier** at 700 weight with negative letter-spacing (32–64px) for headlines and
statistics, and a **UI tier** (12–18px) that reads quietly under it.

Buttons are pills at 90px radius with an unusual amount of horizontal padding
(28px on the standard CTA), giving them a comfortable, almost over-padded feel.
The aubergine pill is the only filled button in most contexts.

### Key characteristics

- Single aubergine primary reused across CTAs, the featured surface, the closing
  band, and the wordmark — the system's chromatic monotheism.
- Blue inline links (`--color-link-blue`) — the only chromatic departure from
  aubergine in body type.
- Pill buttons at `--radius-pill` (90px) on every labeled button and CTA in the
  app, without exception.
- Tight negative tracking on display sizes (`-0.768px` at 64px) for
  editorial-density headlines.
- The pastel-mesh gradient as the depth language: product UI floats above it, and
  the gradient does the lifting instead of a shadow.
- A separate **categorical** status palette for the pipeline — the one deliberate
  break from the single-accent rule, explained below.

## Color

Every token here is a `--color-*` custom property in the `@theme` block.

### Brand & accent

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#4a154b` | Filled CTAs, featured surfaces, the wordmark |
| `--color-primary-deep` | `#481a54` | Near-identical sibling; treat as equivalent |
| `--color-primary-press` | `#611f69` | Hover and pressed state of the primary pill |
| `--color-primary-tint` | `#592466` | Border accent on aubergine-on-aubergine surfaces |
| `--color-link-blue` | `#1264a3` | Inline links |
| `--color-link-hover` | `#3860be` | Link hover |

### Surface

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#ffffff` | Default content surface; card fill |
| `--color-canvas-cream` | `#f4ede4` | Warm off-white; the pastel-mesh base and Kanban column beds (at 50% opacity) |
| `--color-canvas-lavender` | `#f9f0ff` | Secondary-button fill, feature cards, the sidebar's active item |
| `--color-canvas-lavender-hover` | `#ebdcf5` | Secondary-surface hover |
| `--color-canvas-error` | `#fdf0f0` | Error surface |
| `--color-surface-elev` | `#ffffff` | Elevated surface |
| `--color-surface-aubergine` | `#4a154b` | The closing CTA band on the landing page |
| `--color-surface-hover` | `#f5eded` | Hover on neutral surfaces |
| `--color-hairline` | `#e6e6e6` | 1px card borders and dividers |
| `--color-hairline-strong` | `#000000` | High-contrast border |

### Text

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#1d1d1d` | Body text on light surfaces; also the focus ring |
| `--color-ink-mute` | `#696969` | Secondary text, captions, helper copy |
| `--color-on-primary` | `#ffffff` | Text on aubergine surfaces and filled CTAs |
| `--color-on-aubergine-mute` | `#d9bdde` | Secondary text on aubergine surfaces |

### Semantic

Status feedback, never decoration. Each pairs a foreground with a tint.

| Token | Value | Use |
| --- | --- | --- |
| `--color-semantic-error` | `#cc4117` | Form errors, destructive actions |
| `--color-semantic-error-tint` | `#fdebea` | Error background |
| `--color-semantic-error-hover` | `#fad8d6` | Error-surface hover |
| `--color-semantic-success` | `#007a5a` | Success indicators |
| `--color-semantic-success-tint` | `#e2f1ea` | Success background |
| `--color-semantic-warning` | `#d69f12` | Warnings |
| `--color-semantic-warning-tint` | `#fcf2db` | Warning background |

### Pipeline status — a categorical scale

The five pipeline stages need colors that read as *different*, not as *more or
less branded*, so they come from Tailwind's palette rather than the aubergine
system. `STATUS_COLORS` in
[`src/components/ui/status-colors.ts`](../src/components/ui/status-colors.ts) is
the single source: one entry per status, each supplying the five surfaces that
status can appear on (`badge`, `dot`, `fill`, `num`, `seg`).

| Status | Hue | Reads as |
| --- | --- | --- |
| `SAVED` | zinc | Not yet acted on |
| `APPLIED` | blue | In flight |
| `INTERVIEW` | amber | Live, needs attention |
| `OFFER` | green | Won |
| `REJECTED` | red | Closed |

This is the system's one sanctioned break from the single-accent rule — see
[Deliberate departures](#deliberate-departures).

## Typography

One family: **Inter**, loaded by `next/font` in
[`src/app/layout.tsx`](../src/app/layout.tsx) as `--font-inter` and wired to
`--font-sans`, falling back to `ui-sans-serif, system-ui`.

### Display tier

Implemented as `@utility` classes in `globals.css`, not as `@theme` variables —
each bundles size, weight, leading and tracking so a headline can never be set
at default tracking by accident.

| Utility | Size | Weight | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `font-display-xxl` | 64px | 700 | 1.12 | -0.768px | Landing hero headline |
| `font-display-lg` | 50px | 700 | 1.12 | -0.6px | Statistics numerals |
| `font-display-md` | 32px | 700 | 1.25 | -0.256px | Page and section titles — the workhorse |
| `font-display-sm` | 24px | 700 | 1.25 | -0.192px | Compact card titles |

### UI tier

`--text-*` tokens in the `@theme` block. This scale is denser than the source
study's, because app chrome carries more information per screen than a marketing
page does.

| Token | Size | Use |
| --- | --- | --- |
| `--text-title` | 18px | Card titles, primary CTA labels |
| `--text-body-lg` | 16px | Emphasized body, form fields and labels, button labels |
| `--text-body` | 14px | Default UI body |
| `--text-caption` | 13px | Helper text, captions |
| `--text-fine` | 12px | Fine print, all-caps eyebrows |

### Principles

- **Tight tracking on display.** Negative letter-spacing across 24–64px. Without
  it the headlines read loose and unedited.
- **Button labels are bold with positive tracking.** `font-bold` plus
  `tracking-[0.2px]` — the pill's label has to hold its own inside all that
  padding.

## Layout & spacing

- **Scale.** Tailwind's default 4px scale. The app does not define spacing
  tokens; consistency comes from reusing the component patterns below.
- **Card padding.** `p-8` (32px) on standard cards; `p-6` (24px) on the compact
  lavender feature cards.
- **Section padding.** `py-24` (96px) on the landing page's bands; dashboard
  screens tighten to card-level spacing.
- **Kanban columns.** `p-2` beds on `bg-canvas-cream/50`, so the cards inside
  read as the content and the column as furniture.

## Elevation & depth

Depth is carried by the gradient first and shadows second.

| Level | Treatment | Use |
| --- | --- | --- |
| 0 | Flat | Default surface |
| 1 | `shadow-sm` | Standard cards — a hairline border does most of the work |
| 2 | `shadow-[0_5px_20px_rgba(0,0,0,0.1)]` | The landing hero's primary CTA |
| 3 | `shadow-md` / `shadow-lg` | Dialogs and floating chrome |

**The pastel-mesh gradient** (`bg-pastel-mesh` in `globals.css`) is the signature:
a `--color-canvas-cream` base under three radial-gradient stops — lavender at the
top-right, peach at the bottom-left, dusty green at the bottom-right — blurred at
large radii. It creates a luminous backdrop that makes the product screenshots
above it read as floating, with no literal lift. It is used on the landing page
only ([`src/app/page.tsx`](../src/app/page.tsx)); transactional screens drop the
gradient for a plain canvas.

## Shape

Only one radius is tokenized: `--radius-pill` (90px), used by every button. The
rest of the system uses Tailwind's default radius scale, assigned by role:

| Class | Radius | Role |
| --- | --- | --- |
| `rounded-pill` | 90px | Every labeled button and CTA |
| `rounded-full` | ∞ | Status badges, dots, avatars, progress-bar fills |
| `rounded-2xl` | 16px | Standard cards — the page-level container |
| `rounded-xl` | 12px | Compact surfaces: list rows, Kanban columns and cards, sidebar items, streamed-output panels, loading skeletons |
| `rounded-lg` | 10px | Inline message banners, icon-only affordances, the landing page's miniature mock cards |
| `rounded-md` | 8px | Logo tiles |
| `rounded-sm` | 4px | Form inputs |

Two clarifications the table can't carry:

- **The pill rule covers labeled buttons only.** The board's icon-only drag handle
  ([`board.tsx`](../src/components/applications/board.tsx)) is square-ish on
  purpose — a 90px pill around a 16px grip icon reads as a lozenge, not a handle.
- **The landing page's product mock scales its radii down.** A real card is
  `rounded-2xl` and a real sidebar item `rounded-xl`; inside the miniature mock
  they are `rounded-lg` and `rounded-md`. The mock is a scale model, so its
  corners scale too.

## Motion

- `--animate-rise` — 0.5s `cubic-bezier(0.22, 1, 0.36, 1)`: fade in while
  translating up 10px. The system's single entrance animation.
- It is disabled under `prefers-reduced-motion: reduce`.

## Components

### Buttons

**Primary pill** — the dominant CTA.

```text
bg-primary text-on-primary font-bold text-body-lg tracking-[0.2px]
py-3.5 px-7 rounded-pill hover:bg-primary-press transition-colors
```

14px × 28px padding, exactly as the source study specifies. The hover state
shifts the fill to `--color-primary-press`. The landing hero's version scales up
(`sm:text-title`, `px-9`) and adds the level-2 shadow plus a `hover:scale-105`.

**Secondary pill** — the paired action beside the primary.

```text
bg-canvas-lavender text-primary border-2 border-primary font-bold
py-3 px-6 rounded-pill
```

Lavender fill with an aubergine border and label. It reads as a gentler echo of
the primary while staying clearly actionable.

### Cards

- **Standard** — `rounded-2xl border border-hairline bg-canvas p-8 shadow-sm`.
  Title in `font-display-sm` or `font-display-md`, body in `--text-body`.
- **Feature (lavender)** — `rounded-xl border border-hairline bg-canvas-lavender
  p-6`. Used for the AI-feature explanations.
- **Aubergine band** — `bg-surface-aubergine text-on-primary py-24 px-6
  md:px-12`. The full-bleed closing CTA on the landing page; white type, and the
  page's signature moment.

### Inputs

`inputClass` in
[`src/components/ui/form-styles.ts`](../src/components/ui/form-styles.ts) is the
only place a field is styled:

```text
rounded-sm border border-hairline bg-canvas px-3 py-2.5 text-body-lg text-ink
focus:border-primary focus:ring-1 focus:ring-primary
```

`labelClass` pairs with it. Every form in the app imports both — a field styled
by hand is a bug.

### Inline message banner

One shape for every inline message the app shows — auth errors, form validation,
the upload failure, the stale-analysis warning:

```text
rounded-lg px-4 py-3 text-body font-medium
```

The surface picks the meaning: `bg-canvas-error` / `--color-semantic-error` for
failures, `bg-semantic-warning-tint` for warnings, `bg-canvas-lavender` for
neutral status. Errors carry `role="alert"`, status messages `role="status"`.

### Status badge

A soft pill using the `badge` entry of `STATUS_COLORS` — tinted background, dark
text of the same hue. The dashboard pipeline reuses the same record's `dot`,
`fill`, `num` and `seg` entries, so a status can never be one color on the board
and another on the funnel.

### Links

`--color-link-blue`, underlined on hover. On aubergine surfaces links render in
`--color-on-primary` with a persistent underline.

### Focus ring

A system-wide accessibility rule in `globals.css` that the source study has no
equivalent for:

```css
:focus-visible:not(input):not(textarea):not(select) {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px var(--color-canvas);
}
```

A `currentColor` ring would be white-on-white on the aubergine-filled buttons.
An ink ring separated from the element by a white halo stays visible on light
surfaces and aubergine ones alike.

## Responsive behavior

Tailwind's default breakpoints. The pattern in practice:

- Type steps down below `sm`: the hero CTA drops from `--text-title` to
  `--text-body-lg`, and pill padding tightens from `py-3.5 px-7` to
  `py-2.5 px-5`.
- Buttons go full-width (`w-full sm:w-auto`) on the landing page's mobile layout.
- Multi-column grids collapse to a single column; the Kanban board scrolls
  horizontally rather than reflowing.

**Touch targets.** The over-padded pill geometry lands buttons at roughly 52px
tall and form fields at 44px — meeting the 44×44 CSS-pixel target of WCAG 2.5.5
(Target Size, AAA). This is why pill padding is not a free parameter.

## Do's and Don'ts

### Do

- Reserve aubergine for filled CTAs, the featured surface, and the closing band —
  one filled aubergine button per viewport.
- Use `rounded-pill` for every labeled button and CTA.
- Set headlines with a `font-display-*` utility so tracking comes along with the
  size.
- Import `inputClass` / `labelClass` for every form field.
- Take pipeline colors from `STATUS_COLORS`, never by hand.

### Don't

- Don't add a fourth color family. Aubergine, link-blue, and the semantic/status
  scales are the whole system.
- Don't use aubergine for body text — it is a surface and CTA color.
- Don't shrink pill padding: the geometry is what keeps touch targets compliant.
- Don't set a size with `text-sm` / `text-xs` — reach for a `--text-*` token, so
  a change to the scale reaches every surface.
- Don't render display type at default tracking.
- Don't put product screenshots inside card chrome on the landing page — they sit
  above the pastel-mesh gradient, never inside it.
- Don't reach for a shadow where the gradient or a hairline border will do.

## Deliberate departures

Where Job Tracker diverges from the source study, and why. These are choices, not
drift:

| Departure | Why |
| --- | --- |
| **A categorical status palette** breaks the study's "never add a third accent" rule | Five pipeline stages must be *distinguishable*, not *branded*. Ranking them by how aubergine they are would encode a meaning the data doesn't have. Confined to `STATUS_COLORS`, so it can't leak into brand surfaces. |
| **A denser UI type scale** (12–18px) instead of the study's 14–18px marketing scale | A dashboard row carries more information per line than a marketing paragraph. The display tier was kept verbatim; only the body tier tightened. |
| **The secondary pill gained an aubergine border and label** | The study's flat lavender pill on a white card had too little edge definition to read as a button in a dense UI. |
| **Radius and spacing use Tailwind's default scales** rather than the study's custom token sets | The study's values survive (32px card padding, 16px card radius); expressing them through Tailwind's scale means one system to learn, not two. Only `--radius-pill` needed a token, because 90px has no Tailwind equivalent. |
| **Marketing-only inventory was dropped** — pricing tiers, statistics rows, photography treatment, the multi-column footer | The app has no surface for them. |
| **A focus-ring rule was added** | The study never contended with aubergine-filled buttons, where a `currentColor` ring disappears. |

## Provenance

This system was adapted from a design-language study of a Slack-inspired
marketing site: the aubergine palette, the cream and lavender canvases, the 90px
pill, the pastel-mesh gradient, and the display-typography rules all come from
there. Its two proprietary faces (Salesforce Avant Garde for display, Salesforce
Sans for UI) are substituted with **Inter**, the closest open analogue across both
tiers. Everything the app actually ships is listed above and lives in
`globals.css` — this document describes the system as built, not the study it
came from.

## Related docs

- [Architecture & design decisions](architecture.md)
- [Local setup & scripts](setup.md)
