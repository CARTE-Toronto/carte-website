# Carte Components Migration — Design Spec
_2026-05-21_

## Goal

Bring the Carte website into full compliance with the `carte-components` design system. The system lives in `carte-components/carte-components.css` and `carte-components/examples.html`. Every primitive (button, card, badge, form control) must use a `carte-*` class. Tailwind is retained for layout only (grid, max-width, padding, flex).

## Hard rules enforced throughout

From `carte-components/CLAUDE.md`:
- No drop shadows (`shadow-*`)
- No gradients (`bg-gradient-*`, `bg-clip-text`)
- No scale transforms (`scale-*`, `hover:scale-*`)
- No `backdrop-blur` outside of Header scroll effect (that's intentional UX)
- Cream is the page canvas (`--surface-page`), white is for cards (`--surface-card`)
- U of T Blue dominates; secondary blue is an accent

## Layer 1 — CSS setup

**Files changed:** `src/styles/global.css`, `src/styles/base.css`, add `src/styles/carte-components.css` (copied from `carte-components/carte-components.css`)

- Copy `carte-components/carte-components.css` → `src/styles/carte-components.css`
- Import it in `global.css` after Tailwind, before `base.css`
- Update `base.css` body rule: replace `@apply text-slate-800` with `color: var(--text-body)` so base text uses the semantic token
- Headings in `base.css` keep `font-extrabold` but inherit `color: var(--text-strong)` from the token

## Layer 2 — Shared components

### Button.astro (`src/components/Button.astro`)

- Remove all Tailwind variant class strings
- `primary` variant → `carte-btn-primary`
- `secondary` variant → `carte-btn-ghost`
- `on-dark` variant → `inv-btn primary` (matches the inverse-CTA pattern from examples.html)
- Remove the SVG arrow; append ` →` text inside the slot or as a sibling span
- Component still accepts `href` and `class` props; layout classes (flex, width) passed via `class` prop by callers

### Card.astro (`src/components/Card.astro`)

- Replace all Tailwind classes on the outer wrapper with `carte-card`
- Remove `shadow-sm`, `hover:shadow-xl`, `hover:scale-[1.02]`, `transition-all`
- Tag span: replace ad-hoc classes with `.tag` pattern from examples.html (`bg-[var(--surface-info)] text-[var(--brand-primary)]` uppercase pill)
- "Read more" link: replace with `link-arrow` pattern (text + `→`, no SVG)
- Keep Tailwind only for `h-full`, `flex`, `flex-col` structural layout

### Section.astro (`src/components/Section.astro`)

- Remove the `bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl` wrapper div around the title/subtitle
- Title: `font: 800 ...` via Tailwind classes, color via `var(--text-strong)` (already in tokens)
- Subtitle: color via `var(--text-muted)`
- Keep tint overlay and background logic unchanged (it's layout, not component styling)

### Hero.astro (`src/components/Hero.astro`)

- H1: remove `bg-gradient-to-r ... bg-clip-text text-transparent` — render in `var(--text-strong)` / `text-uoft-blue`
- CTA buttons: wrap `<a>` in `carte-btn-primary` / `carte-btn-ghost` instead of ad-hoc classes; remove the `rounded-full shadow-lg hover:shadow-xl transition-shadow` wrapper div
- Organic image blob: remove `bg-gradient-to-br from-uoft-blue to-secondary-blue`, keep the `bg-uoft-blue` base; remove `shadow-2xl` and the gradient overlay `div`
- Newsletter form inputs: replace ad-hoc `px-3 py-2 rounded-lg border ...` with `carte-input`; select → `carte-select`; checkboxes → `carte-check`; submit button → `carte-btn-primary` (full-width variant via `w-full` Tailwind class)

## Layer 3 — index.astro patterns

### Student/Faculty callout row

Current: two `inline-flex` pill divs with `shadow-sm hover:shadow-md hover:scale-105`.

Replace with two `.callout` composed patterns:
```
.callout > .chip ("For Students") + .pitch (text) + .cta ("Find opportunities →")
.callout > .chip ("For Faculty", dark-green bg) + .pitch + .cta
```
Chip backgrounds: `var(--brand-primary)` for students, `var(--color-uoft-dark-green)` for faculty (matches examples.html).

### "Our Approach" cards

Current: `bg-white rounded-xl p-6 border border-slate-200 hover:border-secondary-blue hover:shadow-lg`

Replace with `carte-card` on each. Remove icon background div (`bg-secondary-blue/10 rounded-lg`); keep icon inline with `color: var(--brand-primary)`. Remove `hover:shadow-lg`. Link text → `link-arrow` pattern.

### Impact stats section

Current: plain `text-center` divs with `text-5xl font-extrabold text-white`.

Replace with `.stat` composed pattern (large num in `--brand-primary`, label below). Section background stays navy (this is an inverse section); stat cards sit on `--surface-card` (white).

### Impact callout / quote block

Current: `bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20` with inline CTA.

Replace with `.inverse-cta` pattern: navy block, headline, sub-paragraph, row of `.inv-btn.primary` + `.inv-btn.ghost`. Copy updated to Carte voice.

## Layer 4 — Remaining pages

All pages (`training.astro`, `partnerships.astro`, `students.astro`, `faculty.astro`, `about.astro`, `contact.astro`, `research.astro`, `mitacs-project-explorer.astro`):

- Remove every `shadow-*`, `hover:shadow-*`, `scale-*`, `hover:scale-*`, `bg-gradient-*`, `bg-clip-text` class
- Replace any inline button markup with `carte-btn-primary` / `carte-btn-ghost`
- Replace card-like blocks with `carte-card`
- Replace badge-like chips with `carte-badge` (+ variant modifier)
- Replace form inputs/selects/textareas/checkboxes with `carte-*` form classes
- Stat numbers → `.stat` pattern where present
- Inverse/dark CTA blocks → `.inverse-cta` pattern

## What is NOT changed

- Header scroll effect `backdrop-blur-lg` — intentional UX, not a component
- `InteractiveDots.astro` — layout/animation, not component styling
- `WaveDivider.astro` — structural
- `Footer.astro` — already on `bg-uoft-blue` (inverse surface), text/link colours are compliant; only minor cleanup if shadow or off-spec colour appears
- Content files in `src/content/` — untouched

## Success criteria

- Zero `shadow-*` classes in component/page files (grep confirms)
- Zero `scale-*`, `bg-gradient-*`, `backdrop-blur` outside Header
- Every button uses `carte-btn-primary` or `carte-btn-ghost` (or `inv-btn` inside `.inverse-cta`)
- Every card uses `carte-card`
- Every badge uses `carte-badge`
- Every form input uses `carte-input`, `carte-select`, `carte-textarea`, or `carte-check`
- Site runs `astro build` with no errors
