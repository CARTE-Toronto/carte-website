# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, weighted equally (confirmed by the Director). Each has its own landing path and none outranks the others.

- **Industry and public-sector partners.** Decision-makers at organisations (energy, food and beverage, healthcare, genomics, trade, manufacturing, government) who want to apply AI and need expertise, trained staff, or research capacity. They arrive evaluating whether Carte is a credible, low-friction route into UofT Engineering, and want to know what an engagement looks like before they email.
- **UofT Engineering faculty.** Researchers deciding whether to supervise a Mitacs Accelerate intern, attend the annual faculty ML bootcamp, join the Generative AI Training Program, or get help with NSERC Alliance / Mitacs applications.
- **UofT Engineering students** (undergraduate, graduate, postdoc). Looking for paid applied-AI research roles, the Mitacs Project Explorer, the Student CV Bank, hackathons, and the opportunities mailing list.

## Product Purpose

The public website of Carte, the Centre for Analytics and Artificial Intelligence Engineering at the University of Toronto's Faculty of Applied Science & Engineering. Carte has operated since 2019 as the Faculty's applied-AI hub. The site explains what Carte does, shows proof of past work, and routes each audience to the right next step.

Success (confirmed) is any of:

- an inbound partnership enquiry from an organisation about research, training, or funding;
- a training enquiry or booking for a custom bootcamp or workshop;
- a newsletter signup.

Mitacs project flow (students finding projects, faculty listing them) is served by the site but was not named as a success outcome.

## Positioning

- **Translation, not publication.** Carte is explicitly not a traditional research institute. It helps organisations implement AI through training, partnerships, and practical collaboration, and prioritises deployment over papers.
- **One partnership reaches all of UofT Engineering.** A single relationship with Carte gives access to 100+ faculty affiliates across 8 engineering departments (Chemical; Civil & Mineral; Electrical & Computer; Biomedical; Mechanical & Industrial; Materials Science; Aerospace; Transdisciplinary), plus 700+ graduate students and postdocs.
- **Funding navigation is part of the offer.** Carte guides partners and faculty through NSERC Alliance and Mitacs Accelerate (research awards of $15,000 to $20,000 per internship, industry funding matched by government).
- **Sector-specific training delivered by practitioners**, from executive briefings to multi-day technical bootcamps.

## Operating Context

- Engagements range from a single workshop to multi-year research collaborations. Typical shapes: custom corporate training, capstone design projects (student teams over a semester with faculty supervision), Mitacs-funded internships, sponsored research, speaker seminars, hackathons, and consulting guidance.
- Training has been delivered on-site for partners (e.g. Princess Margaret Hospital for a genomic data science intensive) and for international delegations.
- Recurring rituals: an annual 5-day faculty ML bootcamp; researcher bootcamps; the Generative AI Training Program recruiting faculty to design short discipline-specific GenAI modules.
- Physical location: Myhal Centre for Engineering Innovation and Entrepreneurship, 55 St. George Street, Toronto, on the St. George campus.
- Contact channel: carte@utoronto.ca. Meeting booking on the contact page is temporarily disabled (commented out in code).
- The Mitacs Project Explorer is a Retool public app embedded in an iframe; project data lives outside this repo.
- Newsletter signups post to a small Node service (`subscribe-api/`) that creates Resend contacts. The form collects email, name, organisation, UofT academic unit, and affiliation (graduate, faculty, postdoc, external).

## Capabilities and Constraints

- **Stack:** Astro 5 static build, Tailwind v4 via the Vite plugin, MDX content collections. Deployed as a Docker image served by Caddy on a VM via GitHub Actions; a beta workflow also exists. Primary domain carte.utoronto.ca with www redirecting.
- **Routes:** `/`, `/about`, `/research`, `/training`, `/partnerships`, `/students`, `/faculty`, `/contact`, `/genai-training-program`, `/mitacs-project-explorer`. A legacy `/what-is-carte/` redirect is handled in Caddy.
- **Content collections** (`src/content/`): `research` (8 entries with authors, venue, year), `training` (15 entries with audience, duration, optional testimonial), `partnerships` (6 service descriptions). Schemas in `src/content/config.ts`.
- **Component system:** `carte-components/` holds the extracted CSS primitives and a reference `CLAUDE.md`; `src/styles/carte-components.css` and `carte-patterns.css` are the in-site copies. All primitives are prefixed `carte-`.
- **Terminology:** "Carte" (not CARTE) in prose and the header wordmark; "Mitacs" (not MITACS); "UofT" in running copy; "U of T Blue" for the primary brand colour. Headings and card titles use sentence case.
- **Accessibility gate:** `npm run a11y` runs pa11y-ci at WCAG 2 AA across all ten routes (`.pa11yci.json`). Past violations were contrast and labelling; new work must pass this.
- **Static hosting:** no server-side rendering. Interactive pieces are the Retool embed, the subscribe form, and small inline scripts.
- **Undecided:** whether meeting booking returns to the contact page, and in what form.

## Brand Commitments

- **Canonical design system:** the Claude Design handoff bundle at `../carte-design-system/` (sibling directory, outside this repo). Its `project/readme.md` is the long-form brand and product-chapter reference; `project/tokens/`, `project/css/`, `project/components/`, and `project/ui_kits/website/` mirror this repo's styles and components, and `project/guidelines/` and `project/assets/` carry the brand system (logos, lockups, textures, fonts, imagery). It was built from this repo (synced 2026-08-24), the previous Carte brand kit, and University of Toronto Brand Portal PDFs (voice, writing principles, punctuation, protected language, social media). Treat it as the binding brand authority alongside `carte-components/CLAUDE.md`; when the two disagree, ask. The same tokens drive the website, decks, reports, social posts, and email, so the site is one surface of a wider brand output.
- Carte is a unit of UofT Engineering and carries the University's identity: the UofT crest and UofT Engineering logo in the header, the "Defy Gravity" campaign badge and the land acknowledgement in the footer. These are institutional requirements, not decoration. Wherever the U of T affiliation is stated, a U of T mark must be present, never a typographic substitute. The land acknowledgement appears verbatim, never abridged.
- **Logo rules:** four approved Carte logomark lockups plus wordmarks and one formal U of T · FASE · Carte academic signature. Never recolour, outline, rotate, stretch, box, crop, or shadow them.
- **Imagery:** real faculty, students, and labs in warm daylight. No stock photography, no AI-generated imagery, no duotone, no heavy filters.
- **Social channels:** LinkedIn, Instagram, YouTube, GitHub only.
- **Palette:** only the official University of Toronto colours defined in `src/styles/theme.css` (U of T Blue primary, Secondary Blue, the eight official accents, cool gray, pale cream). No invented or off-brand colours.
- **Type:** Host Grotesk only, weights 400 to 800 in product, 300 for long-form.
- **Material rules from the component system:** U of T Blue dominates; accents stay small; cream page canvas with white cards; no gradients, drop shadows, or duotone; line icons at 24px with 2px stroke; the text arrow "→" is the canonical link affordance.
- **Voice:** plainspoken and specific, single clause where one will do, no exclamation marks, no emoji. Sentence case everywhere except eyebrows and badges, which are uppercase micro. "You" when it is about the reader's benefit, "we" when Carte does the work. Buttons are imperative and concrete ("Partner with us", "Submit application"). Headlines are full sentences with a period. Carte positions by contrast and says what it is not. Canadian spelling in formal documents; the site's form labels currently use "Organization". Superlatives about the University ("world-class faculty", "Canada's leading engineers") are considered fair claims and may stay.
- **Assets on hand:** wordmarks and formal lockup (`public/email/`), UofT crest and Engineering logos (`src/assets/`), Defy Gravity badge, hero photograph (`src/assets/hero-image.jpg`), Director headshot (`src/assets/alex-headshot.jpg`), partner logos for DSI and FASE (`public/email/`).

## Evidence on Hand

Real content that exists in the repo:

- 8 research entries with named authors, venues, and years (e.g. FLODA deepfake assessment at IEEE ICCE 2025; building height estimation; vascular surgery ML).
- 15 training entries naming audiences, durations, and years (2022 to 2025), including partner-specific programs (Mitsubishi ML bootcamp 2025, Schmidt postdocs 2024, energy sector 2023, Korean delegation).
- 6 partnership service descriptions.
- A published Quarto training deck at `public/materials/ai-for-quantitative-analysis.html`.
- Leadership: Alex Olson, Director, with headshot and bio.

**Treat as unverified until the Director confirms (their instruction):**

- All impact figures currently on the site: 150+ professionals trained, 5+ sectors, 1,000+ student community, 30+ applied AI projects, 4.8/5 training satisfaction, 100+ faculty affiliates, 700+ graduate students and postdocs, 8 departments.
- The 9 training testimonials in `src/content/training/*.md` (quotes with generic attributions such as "Genomics researcher, 2024").

The design-system readme describes these figures as real; the Director's instruction on 2026-09-02 to treat them as unverified overrides it until they confirm. Future work may keep these where they already appear but must not promote them to new surfaces, restyle them as headline proof, or add new numbers or quotes without confirmation. Do not invent partner logos, case-study outcomes, pricing, or named client endorsements.

## Product Principles

1. **Three front doors, one house.** Every audience gets a clear path within one viewport of arrival, and no path is visually subordinate to another.
2. **Show the engagement, not the institute.** Lead with what a partner, faculty member, or student actually does with Carte; keep institutional description as supporting context.
3. **Proof is borrowed until confirmed.** Real named work (papers, programs, partners) outranks aggregate numbers; unverified figures never become the hero.
4. **Lower the cost of the first email.** Every page ends in a concrete, low-commitment next step that matches the audience on that page.
5. **Institutional trust is a feature.** UofT and Engineering identity, accessibility conformance, and plain language are the credibility layer; never trade them for expressiveness.

## Accessibility & Inclusion

WCAG 2 AA is the enforced standard (pa11y-ci in CI-style local runs). A public university unit is expected to meet AODA obligations in Ontario, so conformance is a requirement, not an aspiration. Audiences include international delegations and non-technical executives, so copy must stay readable to non-specialists.
