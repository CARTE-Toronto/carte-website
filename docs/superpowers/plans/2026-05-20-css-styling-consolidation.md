# CSS & Styling Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all styling into organized CSS files and reusable Astro components, and migrate the colour system to the official University of Toronto brand palette.

**Architecture:** Idiomatic Tailwind CSS v4 — utility classes stay in markup. A 4-file CSS layer defines tokens, base styles, and custom utilities. Three new Astro components remove repeated markup. The colour system is replaced wholesale: U of T Blue for structure, Secondary Blue for interactive elements, official accents for small details, and a kept `slate` scale for functional neutrals.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@tailwindcss/vite`), MDX. No test runner — verification per task is `npm run build` (catches Astro/Tailwind errors) plus targeted `grep` assertions, with a final manual visual check in the dev server.

**Spec:** `docs/superpowers/specs/2026-05-20-css-styling-consolidation-design.md`

**Working directory note:** all paths below are relative to the repo root `/Users/alex/code/work/carte-website`. The shell may start inside `src/` — `cd` to the repo root first.

**Build note:** `npm run build` writes to `dist/` (gitignored). Never `git add dist/`. Commit steps below name explicit paths.

---

## Task 1: CSS file structure & official-palette tokens

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/styles/theme.css`
- Create: `src/styles/base.css`
- Create: `src/styles/utilities.css`

- [ ] **Step 1: Create `src/styles/theme.css`**

```css
@theme {
  /* Brand — primary & secondary */
  --color-uoft-blue:           #1e3765;
  --color-secondary-blue:      #007894;
  --color-secondary-blue-dark: #006279;

  /* Official accent colours — small details only */
  --color-accent-purple:      #6d247a;
  --color-accent-warm-red:    #dc4633;
  --color-accent-cool-blue:   #6fc7ea;
  --color-accent-teal:        #00a189;
  --color-accent-fuchsia:     #ab1368;
  --color-accent-dark-green:  #0d534d;
  --color-accent-yellow:      #f1c500;
  --color-accent-light-green: #8dbf2e;

  /* Neutrals */
  --color-cool-gray: #d0d1c9;
  --color-pale-bg:   #FDFBF7;

  /* Fonts */
  --font-sans: 'Host Grotesk', system-ui, sans-serif;
}
```

- [ ] **Step 2: Create `src/styles/base.css`**

```css
@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply antialiased text-slate-800;
    background-color: var(--color-pale-bg);
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-sans font-extrabold;
  }
}
```

- [ ] **Step 3: Create `src/styles/utilities.css`**

```css
@utility wave-divider {
  clip-path: ellipse(70% 100% at 50% 100%);
}

@utility hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 4: Replace `src/styles/global.css` with the entry point**

```css
@import "tailwindcss";
@import "./theme.css";
@import "./base.css";
@import "./utilities.css";
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: build completes with no errors. (The old invented tokens `--color-uoft-accent` and `--color-pop` are intentionally gone; markup still referencing them is fixed in later tasks and does not break the build — Tailwind simply skips unknown colour utilities.)

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/styles/theme.css src/styles/base.css src/styles/utilities.css
git commit -m "refactor: split CSS into theme/base/utilities, adopt official UofT palette tokens"
```

---

## Task 2: WaveDivider component

The `<div class="absolute bottom-0 left-0 right-0 h-8 bg-white" style="clip-path: ...">` appears identically 9× across faculty/students/training/research/partnerships.

**Files:**
- Create: `src/components/WaveDivider.astro`
- Modify: `src/pages/faculty.astro`, `src/pages/students.astro`, `src/pages/training.astro`, `src/pages/research.astro`, `src/pages/partnerships.astro`

- [ ] **Step 1: Create `src/components/WaveDivider.astro`**

```astro
---
// White elliptical divider that sits at the bottom of a coloured banner.
---
<div class="absolute bottom-0 left-0 right-0 h-8 bg-white wave-divider"></div>
```

- [ ] **Step 2: Find every occurrence**

Run: `grep -rn 'clip-path: ellipse' src/pages`
Expected: 9 lines (faculty ×3, students ×3, training ×1, research ×1, partnerships ×2).

- [ ] **Step 3: Replace each occurrence**

In each of the 5 pages, add the import to the frontmatter (after the existing `import BaseLayout` line):

```astro
import WaveDivider from '../components/WaveDivider.astro';
```

Then replace every line matching
`<div class="absolute bottom-0 left-0 right-0 h-8 bg-white" style="clip-path: ellipse(70% 100% at 50% 100%);"></div>`
with:

```astro
<WaveDivider />
```

- [ ] **Step 4: Verify**

Run: `grep -rn 'clip-path: ellipse' src/pages`
Expected: no output.
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/WaveDivider.astro src/pages/faculty.astro src/pages/students.astro src/pages/training.astro src/pages/research.astro src/pages/partnerships.astro
git commit -m "refactor: extract WaveDivider component"
```

---

## Task 3: Button component

Standalone call-to-action links styled as buttons (`<a class="inline-flex items-center justify-center px-8 ... rounded-xl ...">`) appear ~10–15× across pages. They are unified into one component, written with final brand colours.

**Scope:** This replaces **standalone `<a>` CTA buttons only**. Leave alone: (a) the in-card "Learn More" pseudo-buttons (`<div class="inline-flex ... w-full px-6 py-3 ...">` — not links, recoloured in Task 7); (b) the two inverse "Contact Us" buttons that sit on dark navy panels and use `bg-white text-[var(--color-uoft-blue)]` with no border (recoloured in Tasks 5–6); (c) `rounded-full` pill buttons in `Header.astro` / `Hero.astro`.

**Files:**
- Create: `src/components/Button.astro`
- Modify: pages containing standalone CTA buttons (see Step 2).

- [ ] **Step 1: Create `src/components/Button.astro`**

```astro
---
interface Props {
  href: string;
  variant?: 'primary' | 'secondary';
  class?: string;
}

const { href, variant = 'primary', class: className } = Astro.props;

const base = 'inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-colors';

const variants: Record<string, string> = {
  primary: 'bg-secondary-blue text-white hover:bg-secondary-blue-dark',
  secondary: 'bg-white text-secondary-blue border-2 border-secondary-blue hover:bg-secondary-blue/10',
};
---

<a href={href} class:list={[base, variants[variant], className]}>
  <slot />
  <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
</a>
```

- [ ] **Step 2: Find every standalone CTA button**

Run: `grep -rn 'inline-flex items-center justify-center px-8' src/pages`
Expected: a list of `<a>` CTA buttons. Inspect each result. Confirmed examples (line numbers approximate):
- `faculty.astro`: "Learn More About Mitacs", "Contact Us", "View All Training Programs", "Contact Us", "Get Funding Support" — and the dark-panel "Contact Us" (`bg-white text-[var(--color-uoft-blue)]`, **skip** — leave per scope note).
- `students.astro`: "Explore Available Projects", "Submit Your CV", "Subscribe to Mailing List" — and the dark-panel "Contact Us" (**skip**).
- Check `index.astro`, `about.astro`, `contact.astro`, `partnerships.astro`, `research.astro`, `training.astro` for further matches and treat each the same way.

- [ ] **Step 3: Replace each standalone CTA button**

Add to each affected page's frontmatter:

```astro
import Button from '../components/Button.astro';
```

For each solid button (currently `bg-indigo-600` / `bg-emerald-600` / `bg-amber-600` text-white):

```astro
<Button href="/target" class="text-lg">Button label</Button>
```

For each outline button (currently `bg-white text-X border-2 border-X`):

```astro
<Button href="/target" variant="secondary" class="text-lg">Button label</Button>
```

Rules:
- Drop the old colour classes — the component supplies brand colour.
- Carry over only positioning/size extras via `class` (e.g. `text-lg`, `mr-4`). Where the original had `text-lg`, keep `class="text-lg"`; combine as `class="text-lg mr-4"` when both were present.
- Drop the old inline arrow `<svg>` — the component renders it.
- Preserve the exact `href` and visible label text.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: build completes with no errors.
Run: `grep -rn 'inline-flex items-center justify-center px-8' src/pages`
Expected: only the two skipped dark-panel "Contact Us" buttons remain.

- [ ] **Step 5: Commit**

```bash
git add src/components/Button.astro src/pages
git commit -m "refactor: extract Button component for CTA links"
```

---

## Task 4: CheckItem component

The checkmark list item `<li class="flex items-start gap-3"><svg .../><span>…</span></li>` appears 38× (faculty ×16, students ×22). The component carries a per-pillar accent colour via `iconClass`.

**Files:**
- Create: `src/components/CheckItem.astro`
- Modify: `src/pages/faculty.astro`, `src/pages/students.astro`

- [ ] **Step 1: Create `src/components/CheckItem.astro`**

```astro
---
interface Props {
  iconClass?: string;
}

const { iconClass = 'text-secondary-blue' } = Astro.props;
---

<li class="flex items-start gap-3">
  <svg class:list={['w-6 h-6 flex-shrink-0 mt-0.5', iconClass]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span><slot /></span>
</li>
```

- [ ] **Step 2: Confirm the count**

Run: `grep -rc 'flex items-start gap-3' src/pages/faculty.astro src/pages/students.astro`
Expected: `faculty.astro:16`, `students.astro:22`.

- [ ] **Step 3: Replace the 38 list items, applying the per-pillar accent**

Add to both pages' frontmatter:

```astro
import CheckItem from '../components/CheckItem.astro';
```

For each `<li class="flex items-start gap-3"> … </li>` block, replace the whole block with `<CheckItem iconClass="…">inner text</CheckItem>`, keeping the exact `<span>` inner content (including any `<a>` / `<strong>`) as the slot content. Use the per-section accent:

| Page | Section (`id` / heading) | Old icon colour | `iconClass` |
|---|---|---|---|
| faculty.astro | `#mitacs-faculty` (Mitacs Accelerate) | `text-indigo-600` | `text-accent-purple` |
| faculty.astro | `#training` (Faculty Training) | `text-emerald-600` | `text-accent-teal` |
| faculty.astro | `#funding` (Funding Support) | `text-amber-600` | `text-accent-warm-red` |
| students.astro | `#mitacs` (Mitacs Accelerate) | `text-indigo-600` | `text-accent-purple` |
| students.astro | `#cv-bank` (Student CV Bank) | `text-emerald-600` | `text-accent-teal` |
| students.astro | `#mailing-list` (Mailing List) | `text-amber-600` | `text-accent-warm-red` |

Example — faculty.astro Mitacs section, this block:

```astro
<li class="flex items-start gap-3">
  <svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <span>Access to motivated, funded student researchers for your research projects</span>
</li>
```

becomes:

```astro
<CheckItem iconClass="text-accent-purple">Access to motivated, funded student researchers for your research projects</CheckItem>
```

Note: the plain-text `<li>✓ …</li>` items in `students.astro` (the "What to Include in Your CV" box, ~lines 314–319) use a literal `✓` character and are **not** this pattern — leave them unchanged.

- [ ] **Step 4: Verify**

Run: `grep -rn 'flex items-start gap-3' src/pages`
Expected: no output.
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/CheckItem.astro src/pages/faculty.astro src/pages/students.astro
git commit -m "refactor: extract CheckItem component with per-pillar accent colour"
```

---

## Task 5: Migrate brand-blue tokens & gray scale

Mechanical find/replace. After this task no `[var(...)]` or `[#hex]` colour values and no `gray-*`/`stone-*` utilities remain.

**Files:** all of `src/pages/*.astro`, `src/components/*.astro`, `src/layouts/*.astro`.

- [ ] **Step 1: Replace `uoft-blue` arbitrary values with the token utility**

Run: `grep -rn '\[var(--color-uoft-blue)\]' src`
For every hit, replace the arbitrary value with the plain utility (the `--color-uoft-blue` token already exists):
- `text-[var(--color-uoft-blue)]` → `text-uoft-blue`
- `bg-[var(--color-uoft-blue)]` → `bg-uoft-blue`
- `from-[var(--color-uoft-blue)]` → `from-uoft-blue`
- `border-[var(--color-uoft-blue)]` → `border-uoft-blue`
- any other prefix → the same `-uoft-blue` utility.

- [ ] **Step 2: Replace the pale-bg hardcoded hex**

Run: `grep -rn '#FDFBF7' src`
Replace (case-insensitive) `bg-[#FDFBF7]` → `bg-pale-bg` and `bg-[#FDFBF7]/80` → `bg-pale-bg/80` (occurs in `Header.astro`).

- [ ] **Step 3: Replace the warm-gray hardcoded hex**

Run: `grep -rn '#F2F0EB' src`
In `src/components/Section.astro` the frontmatter line
`const bgClass = background === 'gray' ? 'bg-[#F2F0EB]' : '';`
becomes
`const bgClass = background === 'gray' ? 'bg-cool-gray' : '';`

- [ ] **Step 4: Standardize the gray scale onto `slate`**

Run: `grep -rEn '\b(gray|stone)-[0-9]' src`
For every hit, replace the family name keeping the numeric shade: `gray-N` → `slate-N`, `stone-N` → `slate-N` (e.g. `text-gray-800` → `text-slate-800`, `border-gray-100` → `border-slate-100`, `border-stone-100` → `border-slate-100`, `hover:bg-stone-100` → `hover:bg-slate-100`). Apply to every prefix (`text-`, `bg-`, `border-`, `hover:` etc.).

- [ ] **Step 5: Verify**

Run: `grep -rEn '\[var\(--color|#FDFBF7|#F2F0EB|\b(gray|stone)-[0-9]' src`
Expected: no output.
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages src/components src/layouts
git commit -m "refactor: replace arbitrary colour values and standardize gray scale onto slate"
```

---

## Task 6: Migrate indigo & `uoft-accent` to Secondary Blue

Indigo is the old dominant accent; `uoft-accent` is the old invented indigo token. Both become Secondary Blue.

**Files:** all of `src/pages/*.astro`, `src/components/*.astro`.

- [ ] **Step 1: Replace `uoft-accent` token usages**

Run: `grep -rn 'uoft-accent' src --include=*.astro`
Replace every usage with the `secondary-blue` equivalent:
- `text-uoft-accent` → `text-secondary-blue`
- `bg-uoft-accent` → `bg-secondary-blue`
- `hover:bg-uoft-accent` → `hover:bg-secondary-blue`
- `hover:text-uoft-accent` → `hover:text-secondary-blue`
- `from-uoft-accent` / `to-uoft-accent` (and `/40` opacity variants) → `from-secondary-blue` / `to-secondary-blue`
- `border-[var(--color-uoft-accent)]` and `hover:border-[var(--color-uoft-accent)]` (in `index.astro`) → `border-secondary-blue` / `hover:border-secondary-blue`

- [ ] **Step 2: Replace `indigo-*` utilities**

Run: `grep -rn 'indigo' src --include=*.astro`
Replace every `indigo-*` utility, mapping by shade:

| Old | New |
|---|---|
| `bg-indigo-600` | `bg-secondary-blue` |
| `hover:bg-indigo-700` | `hover:bg-secondary-blue-dark` |
| `text-indigo-600` | `text-secondary-blue` |
| `hover:text-indigo-800` | `hover:text-secondary-blue-dark` |
| `border-indigo-600` | `border-secondary-blue` |
| `bg-indigo-50` | `bg-secondary-blue/10` |
| `hover:bg-indigo-50` | `hover:bg-secondary-blue/10` |
| `text-indigo-900` | `text-uoft-blue` |
| `text-indigo-200` (light text on dark panels) | `text-slate-200` |
| `from-indigo-900` / `to-indigo-900` | `from-uoft-blue` / `to-uoft-blue` |
| `shadow-indigo-900/20` | `shadow-uoft-blue/20` |
| any other `indigo-*` shade | nearest of the above by role (interactive → `secondary-blue`, dark → `uoft-blue`, light tint → `secondary-blue/10`) |

Note: card-header gradient stops that begin `from-indigo-600 via-…` are handled in Task 7 — leave the full multi-stop gradient lines for now; this step still replaces standalone indigo utilities.

- [ ] **Step 3: Verify**

Run: `grep -rn 'indigo\|uoft-accent' src --include=*.astro`
Expected: the only remaining hits are inside multi-stop decorative gradients (e.g. `from-indigo-600 via-purple-600 to-pink-600`), cleared in Task 7.
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages src/components
git commit -m "refactor: migrate indigo accent to official Secondary Blue"
```

---

## Task 7: Migrate off-brand accent hues, gradients & functional colours

Removes emerald/teal/cyan/violet/pink/amber/orange and the functional red/green. Large fills and gradients become brand blue; small details become official accents; functional states become brand accents.

**Files:** all of `src/pages/*.astro`, `src/components/*.astro`.

- [ ] **Step 1: Collapse decorative multi-stop gradients to the brand gradient**

Run: `grep -rEn 'bg-gradient-to-[a-z]+ from-(indigo|emerald|amber|blue)-' src`
The faculty/students feature-card coloured header bands and the gradient-text headings use vibrant 3-stop gradients. Replace the full gradient class set as follows:
- Card-header bands `from-{indigo|emerald|amber}-600 via-{purple|teal|orange}-600 to-{pink|cyan|red}-600` → `from-uoft-blue to-secondary-blue` (keep the `bg-gradient-to-br` direction).
- Header inner overlay `from-{indigo|emerald|amber}-900/20 to-transparent` → `from-uoft-blue/20 to-transparent`.
- Gradient-text spans `from-{…}-600 via-{…}-600 to-{…}-600 bg-clip-text text-transparent` → `from-uoft-blue to-secondary-blue bg-clip-text text-transparent` (keep `bg-gradient-to-r`).
- Hero/CTA panel gradients already using `from-uoft-blue` keep `from-uoft-blue`; ensure the second stop is `to-secondary-blue` (not an off-brand colour).

Keep neutral background gradients unchanged: `from-slate-50 to-white`, `from-white to-slate-50`, `from-slate-100 to-slate-50`, `from-slate-50 to-transparent`, `from-slate-50 to-transparent` and the `from-indigo-50 to-white` style light wash → change any `*-50`/`*-100` off-brand stop to `slate` or `secondary-blue/10`; pure `slate`/`white` gradients stay.

- [ ] **Step 2: Migrate per-pillar small-detail accents**

Run: `grep -rEn '\b(emerald|teal|cyan|violet|purple|pink|amber|orange)-[0-9]' src`
For remaining hits that are **small details** (icons, tags, callout boxes, hover states), map to the official accent for that section's pillar (Mitacs/research → `accent-purple`, Training/CV → `accent-teal`, Funding/Mailing → `accent-warm-red`):
- Callout box `bg-{emerald|amber|…}-50 … border-l-4 border-{…}-600` → `bg-accent-{teal|warm-red|purple}/10 … border-l-4 border-accent-{teal|warm-red|purple}`.
- Inline link `text-{emerald|amber}-700 hover:text-{…}-900` → `text-accent-{teal|warm-red} hover:text-accent-{teal|warm-red}/80`.
- Heading hover `group-hover:text-amber-700` → `group-hover:text-accent-warm-red`.
- Tag pill `bg-amber-50 text-amber-700` → `bg-accent-warm-red/10 text-accent-warm-red`.
- Carousel-arrow / card hover states `hover:bg-amber-50 hover:border-amber-300`, `group-hover:from-amber-100 group-hover:to-amber-50`, `hover:shadow-amber-100/50`, `group-hover:text-amber-600` → the section's accent at equivalent roles (`hover:bg-accent-teal/10 hover:border-accent-teal/40`, `group-hover:text-accent-teal`, etc.).
- The `students.astro` info-card grid (`bg-indigo-50` / `bg-purple-50` / `bg-pink-50` boxes with `text-*-900` headings, ~lines 204–221) → uniform `bg-secondary-blue/10` with `text-uoft-blue` headings.

- [ ] **Step 3: Migrate functional state colours to brand accents**

Run: `grep -rEn '\b(red|green)-[0-9]' src`
- Form required asterisk / error text `text-red-500` / `text-red-600` → `text-accent-warm-red`.
- Error-status JS strings in `Hero.astro` / `contact.astro` (`status.className = 'text-sm text-red-600'`) → `'text-sm text-accent-warm-red'`.
- Social-link hover `hover:text-red-600` → `hover:text-accent-warm-red`.
- Success-check icon blocks `bg-green-100` + `text-green-600` (in `index.astro`, `about.astro`) → `bg-accent-light-green/15` + `text-accent-dark-green`.

- [ ] **Step 4: Rebuild `Section.astro` tint colours**

In `src/components/Section.astro` the `tintStyles` map hardcodes rgba values, two referencing the old invented colours. Replace the map with values derived from the new palette:

```js
const tintStyles: Record<string, string> = {
  'none': '',
  'warm': 'rgba(253, 251, 247, 0.7)',
  'white': 'rgba(255, 255, 255, 0.5)',
  'blue-light': 'rgba(0, 120, 148, 0.05)',
  'blue-dark': 'rgba(30, 55, 101, 0.88)',
};
```

(`blue-light` = Secondary Blue `#007894` at 5%; `blue-dark` = U of T Blue `#1e3765` at 88%.)

- [ ] **Step 5: Verify**

Run: `grep -rEn '\b(indigo|emerald|teal|cyan|purple|violet|pink|amber|orange|sky|red|green|blue)-[0-9]' src/pages src/components src/layouts`
Expected: no output. (`accent-teal`, `secondary-blue`, etc. have no trailing digit and will not match. `slate-*` is intentionally excluded from this grep and is allowed.)
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages src/components
git commit -m "refactor: migrate off-brand hues, gradients and functional colours to UofT palette"
```

---

## Task 8: Remove stray `<style>` blocks & inline styles

**Files:** `src/pages/faculty.astro`, `src/pages/students.astro`, `src/pages/partnerships.astro`, `src/pages/training.astro`, `src/pages/research.astro`, `src/components/InteractiveDots.astro`.

- [ ] **Step 1: Delete the `scroll-behavior` `<style>` blocks**

`html { scroll-behavior: smooth }` now lives in `base.css`. Delete the entire `<style>…</style>` block from `faculty.astro`, `students.astro`, and from `partnerships.astro` delete just the `html { scroll-behavior: smooth }` rule.

- [ ] **Step 2: Delete the hand-rolled `line-clamp` rules**

Tailwind v4 provides `line-clamp-1/2/3` natively. In `training.astro` and `research.astro`, delete the `.line-clamp-1`, `.line-clamp-2`, `.line-clamp-3` rules from their `<style>` blocks. The markup already uses `line-clamp-N` as utility classes — leave the markup untouched.

- [ ] **Step 3: Replace hide-scrollbar definitions with the utility**

Run: `grep -rn 'scrollbar' src/pages`
- Inline `style="scrollbar-width: none; -ms-overflow-style: none;"` (on carousel containers in `partnerships.astro`, `training.astro`, `research.astro`) → remove the `style` attribute, add `hide-scrollbar` to that element's `class`.
- The `#…-carousel::-webkit-scrollbar { display: none }` rules in the `<style>` blocks → delete (covered by the `hide-scrollbar` utility).
- After removing all rules, delete any now-empty `<style></style>` block.

- [ ] **Step 4: Clean up `InteractiveDots.astro`**

- Line ~13: change `style="z-index: -1;"` to a class — add `-z-10` to the div's `class` and remove the `style` attribute.
- Delete the `<style>` block (lines ~411–420). Replace its effect with utility classes:
  - On `#dots-container` div, add `bg-pale-bg min-h-full` to its `class`.
  - On `#dots-canvas`, add `block` to its `class`.
- Update the dot colour constants to the brand blues (they currently use the old invented navy `#112338`):
  - `const LIGHT_DOT = [17, 35, 56];` → `const LIGHT_DOT = [30, 55, 101];   // #1e3765 U of T Blue`
  - `const DARK_BG = [17, 35, 56];` → `const DARK_BG = [30, 55, 101];       // #1e3765 U of T Blue`
  - Leave `LIGHT_BG` (`[253, 251, 247]` = pale-bg) and `DARK_DOT` (`[253, 251, 247]`) unchanged.

- [ ] **Step 5: Verify**

Run: `grep -rn '<style' src/pages`
Expected: no output.
Run: `grep -rn 'scrollbar-width\|::-webkit-scrollbar\|z-index: -1' src`
Expected: no output (the `hide-scrollbar` utility in `utilities.css` legitimately contains `scrollbar-width` and `::-webkit-scrollbar` — that file is expected and fine; the grep above targets `src/` broadly, so confirm the only hits are `src/styles/utilities.css`).
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages src/components/InteractiveDots.astro
git commit -m "refactor: remove stray style blocks and inline styles, use shared utilities"
```

---

## Task 9: Standardize section padding & fix Card font

**Files:** `src/components/Card.astro`, `src/components/Section.astro`, all `src/pages/*.astro`.

- [ ] **Step 1: Fix the Card font bug**

In `src/components/Card.astro`, the `<h3>` uses `font-serif` with no serif font loaded. Change `text-2xl font-serif font-bold` → `text-2xl font-sans font-bold`.

- [ ] **Step 2: Standardize section vertical padding**

Run: `grep -rEn 'py-[0-9]+ (md|lg):py-[0-9]+' src`
Standardize content-section vertical padding to `py-20 lg:py-28`. Replace these variants where they are a section's own vertical padding: `py-12 md:py-20` (in `Section.astro`), `py-16 lg:py-20`, `py-16 lg:py-24`, `py-20 lg:py-24`, `py-24 lg:py-32` → `py-20 lg:py-28`.
Leave hero-section padding (e.g. `pt-20 lg:pt-24 pb-8`) and standalone `py-20` CTA sections unchanged — only the responsive `py-A {md,lg}:py-B` section-padding pairs are standardized.

- [ ] **Step 3: Verify**

Run: `grep -rEn 'py-[0-9]+ (md|lg):py-[0-9]+' src`
Expected: every remaining hit is `py-20 lg:py-28`.
Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Card.astro src/components/Section.astro src/pages
git commit -m "refactor: standardize section padding and fix Card heading font"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full off-brand colour audit**

Run:
```bash
grep -rEn '\b(indigo|emerald|teal|cyan|purple|violet|pink|amber|orange|sky|rose|lime|fuchsia)-[0-9]|\b(red|green|blue|gray|grey|stone|zinc|neutral)-[0-9]' src/pages src/components src/layouts
```
Expected: no output. (Only `slate-*`, `white`, `black`, and the defined brand tokens may appear.)

- [ ] **Step 2: Arbitrary-value & stray-style audit**

Run: `grep -rEn '\[#|\[var\(' src/pages src/components src/layouts`
Expected: no colour arbitrary values. (`Hero.astro` may retain non-colour arbitrary values like `z-[9999]`, `w-[400px]`, `leading-[1.1]` — these are allowed.)
Run: `grep -rn '<style' src/pages`
Expected: no output.
Run: `grep -rn 'style=' src/pages src/components src/layouts`
Expected: only genuinely dynamic styles remain — `Section.astro` (`style={`background: ${tintColor};`}`), `Hero.astro` (`style={`border-radius: ${organicShapeBorderRadius}`}`), and third-party iframe `style="border:0"` in `contact.astro` / `mitacs-project-explorer.astro`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Visual check in the dev server**

Start the dev server (`npm run dev`) and open each page: `/`, `/about`, `/contact`, `/faculty`, `/students`, `/partnerships`, `/research`, `/training`, `/mitacs-project-explorer`. Confirm:
- Headings and structural elements are U of T Blue `#1e3765`.
- Buttons, links and CTAs are Secondary Blue `#007894`, darkening on hover.
- Feature-card header bands and gradient-text headings use the navy→teal brand gradient.
- Per-pillar icons/callouts show the assigned official accent (purple / teal / warm-red).
- Carousels still scroll with no visible scrollbar; wave dividers render; the interactive dot background renders in brand blue.
- No unstyled or mis-coloured elements.

This step is long-running (`npm run dev`); hand it to the user to run if the executor cannot drive a browser.

- [ ] **Step 5: Final commit (only if Step 4 surfaced fixes)**

```bash
git add src
git commit -m "fix: visual-check corrections for styling consolidation"
```

---

## Self-review notes

- **Spec coverage:** CSS file split (Task 1) · official-palette tokens (Task 1) · arbitrary-value/token cleanup (Task 5) · indigo→Secondary Blue (Task 6) · off-brand hues/gradients/functional colours (Task 7) · accents-on-small-details (Tasks 4, 7) · `wave-divider` & `hide-scrollbar` utilities (Tasks 1, 2, 8) · `line-clamp` removal (Task 8) · `scroll-behavior` move (Tasks 1, 8) · WaveDivider/Button/CheckItem components (Tasks 2–4) · section padding (Task 9) · Section.astro tints (Task 7) · InteractiveDots (Task 8) · Card `font-serif` bug (Task 9) — all covered.
- **Ordering:** components are created with final brand colours first (Tasks 2–4) so their call sites need no later recolouring; bulk colour migration (Tasks 5–7) then handles only the remaining raw markup.
- **Out of scope (per spec):** `public/email/*`, `public/materials/*`, `subscribe-api/`, and the faculty/students "feature card with gradient header" full-block component extraction.
