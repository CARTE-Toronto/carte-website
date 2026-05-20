# CSS & Styling Consolidation — Design

**Date:** 2026-05-20
**Status:** Approved (design) — revised to adopt the official University of
Toronto colour palette.

## Goal

Consolidate all styling so it flows from organized, consistent CSS files and
reusable components — no hardcoded styling leaking into pages — and align the
colour system with the **official University of Toronto brand palette**.

## Approach

Stay idiomatic to Tailwind CSS v4: utility classes remain in markup. The
consolidation targets the *leaks* — inline `style=` attributes, arbitrary
`[#hex]` / `[var()]` values, stray `<style>` blocks, and repeated markup —
and replaces the current invented colours with the official UofT palette.

This is now a **brand-alignment pass**: the colour changes are intentional
and more visible than a pure consolidation. The current theme uses invented
colours (`#112338` navy, `#6366F1` "electric indigo", `#F59E0B` "sunray"
amber) — none are real UofT colours.

## Context: current state

The project is Astro 5 + Tailwind CSS v4. Styling currently lives in a single
29-line `src/styles/global.css` plus utility classes (and many ad-hoc styles)
across pages and components.

Problems found:

- **Token inconsistency.** The same colour is written two ways:
  `text-[var(--color-uoft-blue)]` (99×) and `text-uoft-blue` (6×). Hardcoded
  hex duplicates a token: `bg-[#FDFBF7]` is the `--color-pale-bg` value.
  `bg-[#F2F0EB]` is an untokenized warm gray. Gray scales are mixed:
  `slate-*` (274×), `gray-*` (26×), `stone-*` (4×).
- **Off-brand colours.** Indigo is the dominant accent (~180 usages);
  emerald, teal, cyan, purple, violet, pink, amber, orange used as per-section
  accents. None are official UofT colours.
- **Repeated raw CSS / inline styles.** Wave divider
  `clip-path: ellipse(70% 100% at 50% 100%)` inline 9×. Hide-scrollbar both as
  inline `style=` (3×) and `::-webkit-scrollbar` in `<style>` blocks (3×).
  `scroll-behavior: smooth` redefined in 3 page `<style>` blocks.
  `.line-clamp-1/2/3` hand-reimplemented in `<style>` blocks (Tailwind v4
  ships these natively).
- **Repeated markup.** ~15 button-like links; a checkmark list item repeated
  38× (faculty + students); 6 different section vertical-padding values.
- **Bug.** `Card.astro` uses `font-serif` but no serif font is loaded.

## Scope

- **In scope:** everything under `src/`.
- **Out of scope:** `public/email/*`, `public/materials/*` (standalone
  Quarto/Bootstrap assets), `subscribe-api/`.

## The official UofT palette

**Primary** (dominant): U of T Blue `#1e3765`
**Secondary** (interactive — CTAs, links): Secondary Blue `#007894`
**Accents** (small details only — icons, tags, callout borders; must never
overpower the blues): Purple `#6d247a`, Warm Red `#dc4633`, Cool Blue
`#6fc7ea`, Teal `#00a189`, Fuchsia `#ab1368`, Dark Green `#0d534d`,
Yellow `#f1c500`, Light Green `#8dbf2e`.
**Neutrals:** White `#ffffff`, Cool Gray `#d0d1c9`, Black `#000000`.

## Design

### 1. CSS file organization

Split the single `global.css` into focused files, imported in order:

```
src/styles/global.css      → @import "tailwindcss"; + imports below
src/styles/theme.css       → @theme block (all design tokens)
src/styles/base.css        → @layer base (body, headings, scroll-behavior)
src/styles/utilities.css   → @utility definitions
```

`BaseLayout.astro` keeps its single `import '../styles/global.css'`.

### 2. Theme tokens (`theme.css`)

```css
@theme {
  /* Brand — primary & secondary */
  --color-uoft-blue:            #1e3765;  /* primary, dominant */
  --color-secondary-blue:       #007894;  /* interactive: CTAs, links */
  --color-secondary-blue-dark:  #006279;  /* hover state for Secondary Blue */

  /* Official accent colours — small details only */
  --color-accent-purple:        #6d247a;
  --color-accent-warm-red:      #dc4633;
  --color-accent-cool-blue:     #6fc7ea;
  --color-accent-teal:          #00a189;
  --color-accent-fuchsia:       #ab1368;
  --color-accent-dark-green:    #0d534d;
  --color-accent-yellow:        #f1c500;
  --color-accent-light-green:   #8dbf2e;

  /* Neutrals */
  --color-cool-gray: #d0d1c9;          /* official light brand gray */
  --color-pale-bg:   #FDFBF7;          /* warm off-white page background */

  /* Fonts */
  --font-sans: 'Host Grotesk', system-ui, sans-serif;
}
```

`white` and `black` are Tailwind built-ins and exactly match the official
neutrals — no token needed.

**Functional neutral gray scale (approved exception):** the brand provides
only one gray, which cannot cover body text + muted text + borders. Keep
**one** Tailwind neutral family — `slate-*` — for body text, muted/secondary
text, and borders. `gray-*` and `stone-*` get standardized onto `slate-*`.

### 3. Colour migration to the official palette

Headings and structural/dominant areas use **U of T Blue**. Buttons, links,
and CTAs use **Secondary Blue** (hover: `secondary-blue-dark`).

Replacement rules applied across `src/`:

- `[var(--color-uoft-blue)]` arbitrary values (`text-`, `bg-`, `from-`, …)
  → the `uoft-blue` utility (e.g. `text-uoft-blue`, `from-uoft-blue`).
- `bg-[#FDFBF7]` / `bg-[#FDFBF7]/80` → `bg-pale-bg` / `bg-pale-bg/80`.
- `bg-[#F2F0EB]` (Section.astro "gray" background) → `bg-cool-gray`.
  Minor visual change: the gray section background becomes slightly
  darker/cooler.
- **Indigo** (buttons, links, CTAs, primary accents) → **Secondary Blue**.
  `bg-indigo-600 hover:bg-indigo-700` → `bg-secondary-blue
  hover:bg-secondary-blue-dark`; `text-indigo-600` → `text-secondary-blue`;
  `border-indigo-600` → `border-secondary-blue`; `bg-indigo-50` light tints →
  `bg-secondary-blue/10`.
- **Off-brand hues** (emerald, teal, cyan, violet, pink, amber, orange used as
  section/pillar accents) → see §4.
- **Decorative multi-stop gradients** (faculty/students card headers, gradient
  text headings) collapse to one brand gradient:
  `bg-gradient-to-* from-uoft-blue to-secondary-blue`.
- **Neutral section-background gradients** (`from-slate-50 to-white`, 13×) are
  kept — they use the functional slate scale, not brand colours.
- **Functional state colours** become brand accents: form errors / required
  asterisks → `accent-warm-red`; success-check icons → `accent-dark-green`
  with `accent-light-green/15` tint backgrounds. Replaces `red-*` / `green-*`.

After migration, the only Tailwind colour family that may appear in `src/` is
`slate-*` (the approved functional neutral), plus `white` / `black` and the
defined brand tokens.

### 4. Accent colours on small details only

Where a page or section currently carries its own accent colour (faculty &
students pillars; the amber-themed training page), assign **one official
accent colour**, used **only on small details** — icons, tags, callout
left-borders and their light tint backgrounds. Large fills, card-header bands,
and gradients use the brand blues, not accents.

Suggested per-pillar mapping (applied consistently per page):

- Mitacs / research pillar → `accent-purple`
- Training pillar / training page → `accent-teal`
- Funding pillar → `accent-warm-red`

Callout boxes currently `bg-indigo-50 border-l-4 border-indigo-600` →
`bg-accent-purple/10 border-l-4 border-accent-purple` (and the teal / warm-red
equivalents).

### 5. Base styles (`base.css`)

Move `html { scroll-behavior: smooth }` here (currently duplicated in 3 page
`<style>` blocks — delete those). Keep `body` and `h1–h6` rules; `body`
background = `--color-pale-bg`, default text = a slate body colour.

### 6. Custom utilities (`utilities.css`)

```css
@utility wave-divider {
  clip-path: ellipse(70% 100% at 50% 100%);
}
@utility hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}
```

- Replaces all 9 inline `clip-path` styles and all 6 scrollbar definitions
  (3 inline `style=` + 3 `::-webkit-scrollbar` blocks).
- **Delete** the hand-rolled `.line-clamp-1/2/3` from `<style>` blocks —
  Tailwind v4 provides `line-clamp-*` natively.

### 7. Astro components to extract

- **`WaveDivider.astro`** — the identical
  `<div class="absolute bottom-0 left-0 right-0 h-8 bg-white wave-divider">`
  used 9×.
- **`Button.astro`** — ~15 button-like links unified. Props: `href`,
  `variant` (`primary` = solid Secondary Blue / `secondary` = outline
  Secondary Blue), optional `class`. Bundles the repeated arrow SVG.
- **`CheckItem.astro`** — the `<li class="flex items-start gap-3">` +
  checkmark SVG repeated 38× on faculty/students. Text via slot. Icon colour
  defaults to `secondary-blue`, overridable for per-pillar accent.

### 8. Section padding

Standardize section vertical padding on the dominant value `py-20 lg:py-28`
(currently 6 different values across pages). Hero sections may keep distinct
padding where intentional.

### 9. Section.astro tint colours

`Section.astro` hardcodes rgba tint colours in its frontmatter, two of which
reference the *old* invented colours (`rgba(99,102,241,…)` old indigo;
`rgba(17,35,56,…)` old navy). Rebuild the tint map from the new palette:
`blue-light` from Secondary Blue, `blue-dark` from U of T Blue `#1e3765`.

### 10. InteractiveDots.astro

The canvas component has hardcoded dot RGB colours and an inline
`style="z-index: -1"`. Update the dot colours to the brand blues (U of T Blue
/ Secondary Blue) and move `z-index: -1` to a `-z-10` utility class. Review
its `<style>` block; keep only what cannot be expressed as a utility.

### 11. Bug fix

`Card.astro` uses `font-serif` with no serif font loaded → change to
`font-sans` to match the rest of the site.

## Out of scope / flagged for later

The full "feature card with gradient header" block on faculty/students is
structurally repeated but content-heavy. Leave as a possible follow-up rather
than forcing a component now.

## Expected visible changes

- Headings/navy elements lighten (`#112338` → official `#1e3765`).
- Buttons/links shift from indigo to Secondary Blue teal-blue `#007894`.
- Per-section emerald/amber/purple accents collapse to blue for large
  elements; small details adopt official accent colours.
- The "gray" section background becomes slightly cooler/darker (Cool Gray).

## Verification

After implementation:

- `npm run build` succeeds.
- No `style=` attributes remain in `src/pages` / `src/components` /
  `src/layouts` except genuinely dynamic ones (`Section.astro` tint,
  `Hero.astro` border-radius, third-party iframe `border:0`).
- No `[#hex]` or `[var()]` arbitrary colour values remain in `src/`.
- No `<style>` blocks remain in pages except component-scoped behaviour that
  cannot be a utility.
- Grep for off-brand Tailwind colour families (`indigo`, `emerald`, `teal-`,
  `cyan`, `purple-`, `violet`, `pink`, `amber`, `orange`, `red-`, `green-`,
  `sky`, `blue-`, `gray-`, `stone-`) returns nothing in `src/`.
- Visual spot-check of each page in the dev server.
