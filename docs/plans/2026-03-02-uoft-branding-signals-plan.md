# UofT Institutional Branding Signals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three targeted institutional UofT brand signals to make the site clearly feel like a UofT unit site.

**Architecture:** Two Astro component files are changed. No new files. No logic changes — purely markup/asset additions. The `defy-gravity-white.svg` and `uoft-crest.svg` assets already exist in `src/assets/` and just need to be wired up.

**Tech Stack:** Astro, Tailwind CSS v4, SVG assets already in `src/assets/`

**Design doc:** `docs/plans/2026-03-02-uoft-branding-signals-design.md`

---

### Task 1: Header — fix mobile crest to use actual crest SVG

**Files:**
- Modify: `src/components/Header.astro`

The current mobile logo is a hacked crop of the full UofT Engineering horizontal wordmark (overflow-hidden on a narrow div). Replace it with the actual `uoft-crest.svg` asset for a clean, recognisable mark at small sizes.

**Step 1: Import the crest asset**

At the top of `src/components/Header.astro`, the frontmatter already imports:
```js
import uoftEngBlue from "../assets/uoft-eng-blue.svg";
import uoftCrest from "../assets/uoft-crest.svg";
import defyGravityWhite from "../assets/defy-gravity-white.svg";
```
`uoftCrest` is already imported but unused. No change needed here.

**Step 2: Replace the mobile crest markup**

Find this block in `src/components/Header.astro` (around line 63–70):
```html
<!-- Crest only on smaller screens - cropped from full logo -->
<div class="lg:hidden h-8 w-4 overflow-hidden">
  <img
    src={uoftEngBlue.src}
    alt="University of Toronto"
    class="h-8 w-auto max-w-none"
  />
</div>
```

Replace with:
```html
<!-- Crest only on smaller screens -->
<img
  src={uoftCrest.src}
  alt="University of Toronto"
  class="lg:hidden h-8 w-auto"
/>
```

**Step 3: Increase the desktop logo size**

Find the desktop logo img (around line 57–61):
```html
<img
  src={uoftEngBlue.src}
  alt="University of Toronto Engineering"
  class="hidden lg:block h-8 xl:h-10 w-auto"
/>
```

Change the height classes:
```html
<img
  src={uoftEngBlue.src}
  alt="University of Toronto Engineering"
  class="hidden lg:block h-10 xl:h-12 w-auto"
/>
```

**Step 4: Verify — build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: exits with no errors, "build complete" or similar.

**Step 5: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: use uoft-crest.svg on mobile, enlarge desktop logo"
```

---

### Task 2: Footer — add Defy Gravity badge

**Files:**
- Modify: `src/components/Footer.astro`

**Step 1: Import the asset**

The frontmatter in `src/components/Footer.astro` currently imports only `uoftEngWhite`. Add the Defy Gravity import:

Find:
```js
import uoftEngWhite from "../assets/uoft-eng-white.svg";
```

Replace with:
```js
import uoftEngWhite from "../assets/uoft-eng-white.svg";
import defyGravityWhite from "../assets/defy-gravity-white.svg";
```

**Step 2: Add the badge to the bottom strip**

Find the bottom strip section (around line 172–179):
```html
<div class="border-t border-blue-900">
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <p class="text-center text-xs text-gray-400">
      &copy; {year} Centre for Analytics and Artificial Intelligence Engineering.
      All rights reserved.
    </p>
  </div>
</div>
```

Replace with:
```html
<div class="border-t border-blue-900">
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <a
      href="https://defygravitycampaign.utoronto.ca/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Defy Gravity campaign"
    >
      <img src={defyGravityWhite.src} alt="Defy Gravity" class="h-8 w-auto" />
    </a>
    <p class="text-center text-xs text-gray-400">
      &copy; {year} Centre for Analytics and Artificial Intelligence Engineering.
      All rights reserved.
    </p>
  </div>
</div>
```

**Step 3: Verify — build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add Defy Gravity badge to footer"
```

---

### Task 3: Footer — add land acknowledgement

**Files:**
- Modify: `src/components/Footer.astro`

**Step 1: Add the land acknowledgement paragraph**

In the same bottom strip div (now updated from Task 2), insert a land acknowledgement paragraph between the main footer grid and the bottom strip. Specifically, add it *inside* the `border-t border-blue-900` div, above the flex row with the copyright, as a separate paragraph.

The full updated bottom strip should look like:
```html
<div class="border-t border-blue-900">
  <div class="max-w-7xl mx-auto pt-6 pb-4 px-4 sm:px-6 lg:px-8">
    <p class="text-center text-xs text-gray-500 max-w-3xl mx-auto leading-relaxed">
      We wish to acknowledge this land on which the University of Toronto operates.
      For thousands of years it has been the traditional land of the Huron-Wendat,
      the Seneca, and the Mississaugas of the Credit. Today this meeting place is
      still the home to many Indigenous people from across Turtle Island and we are
      grateful to have the opportunity to work on this land.
    </p>
  </div>
  <div class="max-w-7xl mx-auto pb-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <a
      href="https://defygravitycampaign.utoronto.ca/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Defy Gravity campaign"
    >
      <img src={defyGravityWhite.src} alt="Defy Gravity" class="h-8 w-auto" />
    </a>
    <p class="text-center text-xs text-gray-400">
      &copy; {year} Centre for Analytics and Artificial Intelligence Engineering.
      All rights reserved.
    </p>
  </div>
</div>
```

**Step 2: Verify — build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add land acknowledgement to footer"
```

---

### Task 4: Visual verification

**Step 1: Run dev server**

```bash
npm run dev
```

Open `http://localhost:4321` in a browser.

**Step 2: Verify header**
- On a wide screen (≥1024px): UofT Engineering horizontal wordmark is visibly larger than the "Carte" text
- On a narrow screen (<1024px): the UofT crest (shield only, no text) appears next to the divider and "Carte"

**Step 3: Verify footer**
- Scroll to the bottom of any page
- The Defy Gravity badge (white SVG) is visible in the bottom strip on the left
- The copyright text is on the right (or below on mobile)
- The land acknowledgement paragraph appears above that row

**Step 4: Final commit (if any fixups needed)**

```bash
git add -p
git commit -m "fix: visual adjustments from dev review"
```
