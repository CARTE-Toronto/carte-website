# CSS & Styling Consolidation — Design

**Date:** 2026-05-20
**Status:** Approved (design)

## Goal

Consolidate all styling so it flows from organized, consistent CSS files and
reusable components — no hardcoded styling leaking into pages. Eliminate
duplicated and divergent style definitions.

## Approach

Stay idiomatic to Tailwind CSS v4: utility classes remain in markup. The
consolidation targets the *leaks* — inline `style=` attributes, arbitrary
`[#hex]` / `[var()]` values, stray `<style>` blocks, and repeated markup —
plus collapsing the color system onto the brand palette.

## Context: current state

The project is Astro 5 + Tailwind CSS v4. Styling currently lives in a single
29-line `src/styles/global.css` plus utility classes (and many ad-hoc styles)
across pages and components.

Problems found:

- **Token inconsistency.** The same color is written two ways:
  `text-[var(--color-uoft-blue)]` (99×) and `text-uoft-blue` (6×). Hardcoded
  hex duplicates a token: `bg-[#FDFBF7]` is the `--color-pale-bg` value.
  `bg-[#F2F0EB]` is an untokenized warm gray. Gray scales are mixed:
  `slate-*` (274×), `gray-*` (26×), `stone-*` (4×).
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
  /* Brand */
  --color-uoft-blue:   #112338;
  --color-uoft-accent: #6366F1;
  --color-pop:         #F59E0B;
  /* Surfaces */
  --color-pale-bg:   #FDFBF7;   /* body background */
  --color-warm-gray: #F2F0EB;   /* replaces bg-[#F2F0EB] */
  /* Fonts */
  --font-sans: 'Host Grotesk', system-ui, sans-serif;
}
```

Project-wide replacements:

- `text-[var(--color-uoft-blue)]` (99×) → `text-uoft-blue`
- `bg-[#FDFBF7]` (3×) → `bg-pale-bg`
- `bg-[#F2F0EB]` → `bg-warm-gray`
- Standardize all `gray-*` and `stone-*` onto `slate-*`. Body text token
  `text-gray-800` → `text-slate-800`.

**Functional colors stay as Tailwind defaults** — `red-*` for form
errors/validation, `green-*` for success-check icons. These are UI states,
not brand accents. Standardize their shades only (`red-600`, `green-600`).

### 3. Accent collapse to brand palette

Emerald/teal/cyan/purple/violet/pink resolve to brand colors:

- `indigo-*` → `uoft-accent`
- `amber-*` / `orange-*` → `pop`
- `emerald-*` / `purple-*` / `violet-*` / `pink-*` / `cyan-*` / `teal-*` →
  `uoft-accent`
- **Decorative multi-stop gradients** (faculty/students card headers like
  `from-indigo via-purple to-pink`) collapse to one brand gradient:
  `from-uoft-blue to-uoft-accent`. The 3 faculty pillar cards will end up
  with identical headers — an accepted visual change.
- **Gradient text** (`bg-clip-text text-transparent` headings) → same brand
  gradient.
- **Neutral section-background gradients** (`from-slate-50 to-white`, 13×)
  are kept — they are not brand accents.

### 4. Base styles (`base.css`)

Move `html { scroll-behavior: smooth }` here (currently duplicated in 3 page
`<style>` blocks — delete those). Keep the existing `body` and `h1–h6` rules
from the current `global.css`.

### 5. Custom utilities (`utilities.css`)

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

### 6. Astro components to extract

- **`WaveDivider.astro`** — the identical
  `<div class="absolute bottom-0 left-0 right-0 h-8 bg-white wave-divider">`
  used 9×.
- **`Button.astro`** — ~15 button-like links unified. Props: `href`,
  `variant` (`primary` = solid indigo / `secondary` = outline), optional
  `class`. Bundles the repeated arrow SVG.
- **`CheckItem.astro`** — the `<li class="flex items-start gap-3">` +
  checkmark SVG repeated 38× on faculty/students. Text via slot.

### 7. Section padding

Standardize section vertical padding on the dominant value `py-20 lg:py-28`
(currently 6 different values across pages). Hero sections may keep distinct
padding where intentional.

### 8. Bug fix

`Card.astro` uses `font-serif` with no serif font loaded → change to
`font-sans` to match the rest of the site.

## Out of scope / flagged for later

The full "feature card with gradient header" block on faculty/students is
structurally repeated but content-heavy. Leave as a possible follow-up rather
than forcing a component now.

## Verification

After implementation:

- `npm run build` succeeds.
- No `style=` attributes remain in `src/pages` / `src/components` /
  `src/layouts` except genuinely dynamic ones (`Section.astro` tint,
  `Hero.astro` border-radius, third-party iframe `border:0`).
- No `[#hex]` or `[var()]` arbitrary color values remain in `src/`.
- No `<style>` blocks remain in pages except component-scoped behavior that
  cannot be a utility.
- Visual spot-check of each page in the dev server.
