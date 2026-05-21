# Carte Components — Claude Code reference

Product primitives extracted from the Carte design system (Centre for Analytics & AI
Engineering, University of Toronto). Drop this folder into a project and link
`carte-components.css`. All component classes are prefixed `carte-`.

## How to use

1. Copy `carte-components.css` into your project and link it in `<head>`:
   ```html
   <link rel="stylesheet" href="carte-components.css">
   ```
2. (Optional) Drop in **Host Grotesk** if you want type-faithful output. The CSS
   falls back to `system-ui` gracefully.
3. Author markup against the classes below. Never restyle them by tag — always
   compose from these primitives.
4. When writing your own CSS, prefer **semantic tokens** (`--surface-card`,
   `--text-strong`, `--brand-primary`) over raw palette values.

`examples.html` is a single-file reference showing every primitive and the
common composed patterns (callouts, stat cards, tables, inverse CTA). Open it
in a browser to see live markup you can copy.

---

## Primitives

### Buttons & links — `.carte-btn-primary`, `.carte-btn-ghost`

Primary is a pill-shaped U of T Blue button; hover shifts to Secondary Blue.
Ghost uses a 2px primary border. Inline link-arrows stay in-line text, not
buttons — `→` is the canonical Carte arrow, not an SVG.

```html
<button class="carte-btn-primary">Partner with us</button>
<button class="carte-btn-ghost">Build AI skills</button>
<a href="#" style="color:var(--brand-primary);font:600 15px var(--font-sans);text-decoration:none">
  Learn more →
</a>
```

### Badges — `.carte-badge`

```html
<span class="carte-badge">Partnership</span>
<span class="carte-badge carte-badge--success">Accepted</span>
<span class="carte-badge carte-badge--warning">Pending review</span>
<span class="carte-badge carte-badge--danger">Deadline passed</span>
```

Badges are UPPERCASE micro by design — copy stays short.

### Cards — `.carte-card`

Hairline border, 20px radius, hover shifts the border to Secondary Blue.
**No drop shadow.** Depth comes from border + spacing, never shadow.

```html
<div class="carte-card">
  <span class="tag">Training</span>
  <h4>Foundations of Applied AI</h4>
  <p>A three-day technical bootcamp.</p>
  <a href="#">Explore course →</a>
</div>
```

### Forms — `.carte-input`, `.carte-select`, `.carte-textarea`, `.carte-label`, `.carte-help`, `.carte-error`, `.carte-check`

```html
<label class="carte-label">
  Full name<span class="carte-label__req">*</span>
</label>
<input class="carte-input" placeholder="e.g. Alex Morgan">
<p class="carte-help">Goes in your application acknowledgement.</p>

<!-- Error state -->
<input class="carte-input carte-input--invalid" value="x">
<p class="carte-error">This doesn't look like a valid U of T email.</p>

<!-- Select -->
<select class="carte-select">
  <option>Industry partner</option>
</select>

<!-- Textarea -->
<textarea class="carte-textarea" placeholder="Briefly describe your project."></textarea>

<!-- Checkboxes / radios share one class -->
<label class="carte-check"><input type="checkbox" checked> Send me the digest</label>
<label class="carte-check"><input type="radio" name="t"> Short engagement</label>
```

---

## Composed patterns

These compose from primitives — **do not** add new tokens for them. Copy the
markup from `examples.html`.

- **Alert** (`.alert.info|success|warning|danger`) — semantic feedback strip
  with icon + bold label + clause. Copy follows Carte voice (plainspoken,
  single clause, no exclamation, no emoji).
- **Empty state** (`.empty`) — dashed border, icon, title, sub, single CTA.
- **Stat card** (`.stat`) — large number in `--brand-primary`, small label.
- **Table** (`.table`) — hairline borders, mono uppercase column heads,
  numeric cells right-aligned in mono.
- **Callout row** (`.callout`) — brand chip + pitch + CTA.
- **Inverse CTA** (`.inverse-cta`) — full block on `--surface-inverse`
  (U of T navy) with white primary button + ghost.

---

## Hard rules (enforce in review)

- **U of T Blue dominates.** Accents are accents — never a page background.
- **Cream is the page canvas, white is for cards.** Never white pages.
- **No gradients. No drop shadows. No duotone.** Depth = border + colour +
  spacing.
- **One type family**: Host Grotesk, 400–800 in product, 300 for long-form
  only.
- **Line icons, 24×24, 2px stroke, `currentColor`.** Social glyphs excepted.
- **Voice:** plainspoken, single clause, no exclamation, no emoji.

### UX copy patterns

| Use case | Do | Don't |
|---|---|---|
| Success | "Application submitted. You'll hear back in ten business days." | "🎉 Yay! We got it!" |
| Error | "This doesn't look like a valid U of T email." | "Oops! Something went wrong." |
| Empty state | "No projects yet. Start by adding your first." | "It's quiet here…" |
| Warning | "Submissions close in 48 hours." | "Hurry!" |
| Label | "Organisation" | "Which org are you from?" |
| Button | "Partner with us" · "Submit application" | "Get Started Now →" |

---

## Tokens reference (the ones components depend on)

Read these out of `carte-components.css` — the file is organised:
1. **Primitive tokens** — palette, type, radii, spacing, motion.
2. **Semantic tokens** — `--surface-*`, `--text-*`, `--border-*`, `--brand-*`,
   feedback `--color-{success,warning,danger,info}` + `-bg` variants.
3. **Component CSS** — buttons, forms, cards, badges, global focus ring.

Prefer semantic tokens when writing new CSS. The paint can change without
touching components.
