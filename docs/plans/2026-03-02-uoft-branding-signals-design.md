# UofT Institutional Branding Signals — Design

**Date:** 2026-03-02
**Branch:** beta
**Context:** Strategic Communications at UofT flagged that the Carte website doesn't feel obviously UofT enough. After auditing peer UofT unit sites (Acceleration Consortium, School of Cities) and comparing to the current beta branch, the root cause is that explicit institutional trust signals are missing — not that the design language is wrong.

---

## Approach

Targeted institutional signals only. No changes to colour palette, typography, or the site's overall aesthetic character. Three changes, all additive or minor layout adjustments.

---

## Changes

### 1. Header — Dual-logo hierarchy

**File:** `src/components/Header.astro`

- Increase the UofT Engineering logo size on large screens: `h-8 xl:h-10` → `h-10 xl:h-12`
- On mobile (< `lg`), replace the current overflow-hidden crop hack with the actual `uoft-crest.svg` asset. The crest is a cleaner, more recognisable UofT mark at small sizes.

**Rationale:** Acceleration Consortium and School of Cities both treat the UofT parent mark as the clear institutional anchor. Currently Carte's header sizes the UofT Eng logo at the same weight as the "Carte" wordmark, making them peers. Enlarging it restores the parent/unit hierarchy.

### 2. Footer — Defy Gravity badge

**File:** `src/components/Footer.astro`

- Import `defy-gravity-white.svg` (already in `src/assets/`)
- Add it to the footer's bottom strip (the `border-t border-blue-900` section), positioned left of or below the copyright line
- Link it to `https://defygravitycampaign.utoronto.ca/`
- Height: `h-8`, white rendering (matches footer background)

**Rationale:** This is the single most-recognised UofT Engineering campaign mark. School of Cities places it in their footer. We have the asset; it just isn't used.

### 3. Footer — Land acknowledgement

**File:** `src/components/Footer.astro`

- Add a land acknowledgement paragraph in the bottom strip, above the copyright line
- Text (condensed, matching UofT standard):
  *"We wish to acknowledge this land on which the University of Toronto operates. For thousands of years it has been the traditional land of the Huron-Wendat, the Seneca, and the Mississaugas of the Credit. Today this meeting place is still the home to many Indigenous people from across Turtle Island and we are grateful to have the opportunity to work on this land."*
- Styling: `text-xs text-gray-400 text-center max-w-3xl mx-auto`

**Rationale:** Present on virtually every UofT unit site. Its absence is noticeable to anyone familiar with UofT institutional norms.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Header.astro` | Logo size + mobile crest fix |
| `src/components/Footer.astro` | Defy Gravity badge + land acknowledgement |

---

## Success Criteria

- The UofT Engineering logo is visually dominant in the header relative to the Carte wordmark
- The Defy Gravity badge is visible in the footer and links correctly
- Land acknowledgement text appears above the copyright line in the footer
- No change to page layout, colour scheme, or typography elsewhere
