# Resend Migration — Newsletter Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two Mailchimp newsletter signup forms with a Resend-backed form, routing submissions through a new internal `subscribe-api` Node.js service.

**Architecture:** A tiny Node.js HTTP server (`subscribe-api/server.mjs`) receives form POSTs and calls Resend's contacts API. Caddy proxies `/api/subscribe` to it; all static file serving is unchanged. The two existing forms are updated to `fetch()` the new endpoint instead of posting to Mailchimp.

**Tech Stack:** Node.js 24 (built-in `fetch`, `node:http`, `node:test`), Resend REST API, Caddy reverse proxy, GitHub Actions, Docker Compose.

---

## File Map

| File | Action |
|---|---|
| `subscribe-api/server.mjs` | Create — HTTP server + request handler |
| `subscribe-api/server.test.mjs` | Create — Node.js built-in test runner |
| `subscribe-api/Dockerfile` | Create — Node 24 Alpine image |
| `src/components/Hero.astro` | Modify — add `lastName` field, replace Mailchimp form with `fetch()` |
| `src/pages/contact.astro` | Modify — replace Mailchimp form with `fetch()` |
| `Caddyfile` | Modify — add `/api/subscribe` proxy route |
| `infra/docker-compose.yml` | Modify — add `subscribe-api` service |
| `.github/workflows/deploy.yml` | Modify — build/push subscribe-api image, write `.env`, deploy new service |

---

## Pre-flight Checklist

Before writing any code, complete these steps in the Resend dashboard:

- [ ] Create an Audience (Audiences → Create Audience). Copy the Audience ID (format: `78261eea-...`).
- [ ] Create an API key with **Audiences** permission only (API Keys → Create API Key). Copy the key — shown once only.
- [ ] Add `RESEND_API_KEY` as a GitHub secret: repo Settings → Secrets and variables → Actions → New repository secret.
- [ ] Add `RESEND_AUDIENCE_ID` as a GitHub secret (same location).

---

## Task 1: Subscribe API Server

**Files:**
- Create: `subscribe-api/server.test.mjs`
- Create: `subscribe-api/server.mjs`
- Create: `subscribe-api/Dockerfile`

### Step 1.1: Write the failing tests

Create `subscribe-api/server.test.mjs`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handleRequest } from './server.mjs';

let server;
let port;
let mockFetch;

before(async () => {
  global.fetch = async (url, options) => mockFetch(url, options);
  server = createServer(handleRequest);
  await new Promise(resolve => server.listen(0, resolve));
  port = server.address().port;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

const post = (body) =>
  fetch(`http://localhost:${port}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('returns 400 when email is missing', async () => {
  const res = await post({ firstName: 'Jane' });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, 'Email required');
});

test('returns 200 on successful subscription', async () => {
  mockFetch = async () => ({ ok: true, json: async () => ({ id: 'contact_123' }) });
  const res = await post({ email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json, { success: true });
});

test('sends correct payload to Resend', async () => {
  let capturedBody;
  mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({}) };
  };

  await post({
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    organization: 'UofT',
    academicUnit: 'Engineering',
    affiliationTypes: ['Graduate Student', 'Faculty'],
  });

  assert.equal(capturedBody.email, 'jane@example.com');
  assert.equal(capturedBody.first_name, 'Jane');
  assert.equal(capturedBody.last_name, 'Smith');
  assert.equal(capturedBody.unsubscribed, false);
  assert.equal(capturedBody.properties.organization, 'UofT');
  assert.equal(capturedBody.properties.academic_unit, 'Engineering');
  assert.equal(capturedBody.properties.affiliation_type, 'Graduate Student, Faculty');
});

test('returns 500 when Resend API fails', async () => {
  mockFetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'Invalid' }) });
  const res = await post({ email: 'bad@example.com' });
  assert.equal(res.status, 500);
  const json = await res.json();
  assert.equal(json.error, 'Failed to subscribe');
});

test('returns 404 for unknown routes', async () => {
  const res = await fetch(`http://localhost:${port}/other`, { method: 'POST', body: '{}' });
  assert.equal(res.status, 404);
});
```

### Step 1.2: Run tests — verify they fail

```bash
node --test subscribe-api/server.test.mjs
```

Expected: error `Cannot find module './server.mjs'`

### Step 1.3: Implement `subscribe-api/server.mjs`

Create `subscribe-api/server.mjs`:

```js
import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;

export async function handleRequest(req, res) {
  if (req.method !== 'POST' || req.url !== '/api/subscribe') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { email, firstName, lastName, organization, academicUnit, affiliationTypes } = data;

  if (!email) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Email required' }));
    return;
  }

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          unsubscribed: false,
          properties: {
            ...(organization && { organization }),
            ...(academicUnit && { academic_unit: academicUnit }),
            ...(affiliationTypes?.length && { affiliation_type: affiliationTypes.join(', ') }),
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', response.status, err);
      throw new Error(`Resend API error: ${response.status}`);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to subscribe' }));
  }
}

if (process.argv[1]?.endsWith('server.mjs')) {
  createServer(handleRequest).listen(PORT, () =>
    console.log(`Subscribe API listening on port ${PORT}`)
  );
}
```

### Step 1.4: Run tests — verify they pass

```bash
node --test subscribe-api/server.test.mjs
```

Expected: all 5 tests pass (`▶ returns 400 when email is missing`, etc.)

### Step 1.5: Create `subscribe-api/Dockerfile`

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY server.mjs .
CMD ["node", "server.mjs"]
```

### Step 1.6: Commit

```bash
git add subscribe-api/
git commit -m "feat: add subscribe-api Node.js service"
```

---

## Task 2: Infrastructure Changes

**Files:**
- Modify: `Caddyfile`
- Modify: `infra/docker-compose.yml`

### Step 2.1: Update `Caddyfile`

In `Caddyfile`, add the following block **immediately before** the existing `handle {` block (around line 15):

```
    handle /api/subscribe {
        reverse_proxy subscribe-api:3000
    }
```

The relevant section of `Caddyfile` after the change should look like:

```
carte.utoronto.ca {
    redir /beta /beta/
    handle_path /beta/* {
        reverse_proxy beta:80
    }

    handle /api/subscribe {
        reverse_proxy subscribe-api:3000
    }

    handle {
        root * /srv
        file_server
        ...
    }
    ...
}
```

### Step 2.2: Update `infra/docker-compose.yml`

Add the `subscribe-api` service. The complete updated file:

```yaml
version: '3.8'

services:
  web:
    image: ghcr.io/carte-toronto/carte-website:latest
    container_name: carte-web
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - carte-net

  beta:
    image: ghcr.io/carte-toronto/carte-website:beta
    container_name: carte-beta
    restart: unless-stopped
    networks:
      - carte-net
    healthcheck:
      test: [ "CMD", "wget", "-q", "--spider", "http://localhost/" ]
      interval: 30s
      timeout: 10s
      retries: 3

  subscribe-api:
    image: ghcr.io/carte-toronto/carte-website-subscribe-api:latest
    container_name: carte-subscribe-api
    restart: unless-stopped
    env_file: .env
    networks:
      - carte-net

volumes:
  caddy_data:
  caddy_config:

networks:
  carte-net:
    driver: bridge
```

### Step 2.3: Commit

```bash
git add Caddyfile infra/docker-compose.yml
git commit -m "feat: wire subscribe-api into Caddy and Docker Compose"
```

---

## Task 3: Update Hero.astro Form

**Files:**
- Modify: `src/components/Hero.astro`

### Step 3.1: Replace the newsletter form section

In `src/components/Hero.astro`, replace the entire `<!-- Newsletter signup -->` block (lines 47–129) with:

```html
<!-- Newsletter signup -->
<details class="mt-8 sm:mt-10 group sm:text-center lg:text-left relative">
  <summary class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-uoft-blue cursor-pointer list-none select-none transition-colors">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    <span>Subscribe to our newsletter</span>
    <svg class="w-3 h-3 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </summary>

  <div class="absolute left-0 sm:left-1/2 lg:left-0 sm:-translate-x-1/2 lg:translate-x-0 top-full mt-2 z-[9999] p-5 bg-white backdrop-blur-md rounded-xl border border-slate-200 shadow-2xl w-[calc(100vw-2rem)] sm:w-[400px] newsletter-panel">
    <form id="hero-subscribe-form" class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="email"
          name="email"
          placeholder="Email *"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          required
        />
        <input
          type="text"
          name="first_name"
          placeholder="First name"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
        />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          name="last_name"
          placeholder="Last name"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
        />
        <input
          type="text"
          name="organization"
          placeholder="Organization (if not UofT)"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
        />
      </div>
      <select
        name="academic_unit"
        class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white text-slate-500"
      >
        <option value="">Academic Unit (if UofT)</option>
        <option value="Applied Science &amp; Engineering">Applied Science & Engineering</option>
        <option value="Arts &amp; Science">Arts & Science</option>
        <option value="Medicine">Medicine</option>
        <option value="Management">Management</option>
        <option value="Other">Other</option>
      </select>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <div class="flex items-center gap-1.5">
          <input type="checkbox" id="hero-graduate" name="affiliation" value="Graduate" class="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
          <label for="hero-graduate" class="cursor-pointer">Graduate</label>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="checkbox" id="hero-faculty" name="affiliation" value="Faculty" class="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
          <label for="hero-faculty" class="cursor-pointer">Faculty</label>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="checkbox" id="hero-postdoc" name="affiliation" value="Postdoc" class="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
          <label for="hero-postdoc" class="cursor-pointer">Postdoc</label>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="checkbox" id="hero-external" name="affiliation" value="External" class="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
          <label for="hero-external" class="cursor-pointer">External</label>
        </div>
      </div>
      <p id="hero-subscribe-status" class="hidden text-sm"></p>
      <button
        type="submit"
        id="hero-subscribe-btn"
        class="w-full px-4 py-2 bg-uoft-blue text-white text-sm font-semibold rounded-lg hover:bg-uoft-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Subscribe
      </button>
    </form>
  </div>
</details>
```

### Step 3.2: Add form submit script

At the bottom of `src/components/Hero.astro`, add a new `<script>` block **after** the existing `</script>` tag:

```html
<script>
  function setupHeroForm() {
    const form = document.getElementById('hero-subscribe-form') as HTMLFormElement | null;
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('hero-subscribe-btn') as HTMLButtonElement;
      const status = document.getElementById('hero-subscribe-status') as HTMLParagraphElement;

      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      status.className = 'hidden text-sm';

      const data = new FormData(form);
      const affiliationTypes = [...form.querySelectorAll<HTMLInputElement>('input[name="affiliation"]:checked')]
        .map(el => el.value);

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.get('email'),
            firstName: data.get('first_name'),
            lastName: data.get('last_name'),
            organization: data.get('organization'),
            academicUnit: data.get('academic_unit'),
            affiliationTypes,
          }),
        });

        if (res.ok) {
          form.innerHTML = '<p class="text-sm text-emerald-600 font-medium py-2">You\'re subscribed! Thank you.</p>';
        } else {
          throw new Error('subscribe failed');
        }
      } catch {
        status.textContent = 'Something went wrong. Please try again or email us at carte@utoronto.ca';
        status.className = 'text-sm text-red-600';
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  document.addEventListener('astro:page-load', setupHeroForm);
</script>
```

### Step 3.3: Verify locally

```bash
npm run dev
```

Open `http://localhost:4321`. Click "Subscribe to our newsletter", open DevTools → Network tab, fill in the form and submit. Verify:
- A POST to `/api/subscribe` appears
- The request body JSON contains `email`, `firstName`, `lastName`, `organization`, `academicUnit`, `affiliationTypes`
- The request will fail (no subscribe-api running locally) — that is expected
- The form shows the error message and re-enables the button

### Step 3.4: Commit

```bash
git add src/components/Hero.astro
git commit -m "feat: update Hero newsletter form to use Resend subscribe API"
```

---

## Task 4: Update contact.astro Form

**Files:**
- Modify: `src/pages/contact.astro`

### Step 4.1: Replace the Newsletter Signup form

In `src/pages/contact.astro`, replace the entire `<form ... id="mc-embedded-subscribe-form" ...>` element and its contents (lines 148–287) with:

```html
<form id="contact-subscribe-form" class="space-y-4">
  <!-- Email -->
  <div>
    <label for="contact-email" class="block text-sm font-medium text-slate-700 mb-1">
      Email Address <span class="text-red-500">*</span>
    </label>
    <input
      type="email"
      name="email"
      id="contact-email"
      placeholder="you@example.com"
      class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow text-sm"
      required
    />
  </div>

  <!-- Name Row -->
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label for="contact-first-name" class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
      <input
        type="text"
        name="first_name"
        id="contact-first-name"
        class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow text-sm"
      />
    </div>
    <div>
      <label for="contact-last-name" class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
      <input
        type="text"
        name="last_name"
        id="contact-last-name"
        class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow text-sm"
      />
    </div>
  </div>

  <!-- Organization -->
  <div>
    <label for="contact-organization" class="block text-sm font-medium text-slate-700 mb-1">Organization (if not UofT)</label>
    <input
      type="text"
      name="organization"
      id="contact-organization"
      class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow text-sm"
    />
  </div>

  <!-- Academic Unit -->
  <div>
    <label for="contact-academic-unit" class="block text-sm font-medium text-slate-700 mb-1">Academic Unit (if UofT)</label>
    <select
      name="academic_unit"
      id="contact-academic-unit"
      class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow text-sm bg-white"
    >
      <option value="">Select...</option>
      <option value="Applied Science &amp; Engineering">Applied Science & Engineering</option>
      <option value="Architecture, Landscape &amp; Design">Architecture, Landscape & Design</option>
      <option value="Arts &amp; Science">Arts & Science</option>
      <option value="Continuing Studies">Continuing Studies</option>
      <option value="Dentistry">Dentistry</option>
      <option value="Education">Education</option>
      <option value="Information">Information</option>
      <option value="Kinesiology &amp; Physical Education">Kinesiology & Physical Education</option>
      <option value="Law">Law</option>
      <option value="Management">Management</option>
      <option value="Medicine">Medicine</option>
      <option value="Music">Music</option>
      <option value="Nursing">Nursing</option>
      <option value="Pharmacy">Pharmacy</option>
      <option value="Public Health">Public Health</option>
      <option value="Social Work">Social Work</option>
      <option value="University of Toronto Mississauga">University of Toronto Mississauga</option>
      <option value="University of Toronto Scarborough">University of Toronto Scarborough</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <!-- Affiliation Type -->
  <fieldset>
    <legend class="block text-sm font-medium text-slate-700 mb-2">Affiliation Type</legend>
    <div class="grid grid-cols-2 gap-2 text-sm">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Undergraduate" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Undergraduate</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Graduate Student" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Graduate Student</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Postdoc" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Postdoc</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Faculty" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Faculty</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Librarian" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Librarian</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="UofT Staff" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">UofT Staff</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="Alumni" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">Alumni</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="affiliation" value="External Partner" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
        <span class="text-slate-600">External Partner</span>
      </label>
    </div>
  </fieldset>

  <p id="contact-subscribe-status" class="hidden text-sm"></p>

  <button
    type="submit"
    id="contact-subscribe-btn"
    class="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  >
    Subscribe
  </button>
</form>
```

### Step 4.2: Add form submit script

At the bottom of `src/pages/contact.astro`, just before the closing `</BaseLayout>` tag, add:

```html
<script>
  function setupContactForm() {
    const form = document.getElementById('contact-subscribe-form') as HTMLFormElement | null;
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('contact-subscribe-btn') as HTMLButtonElement;
      const status = document.getElementById('contact-subscribe-status') as HTMLParagraphElement;

      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      status.className = 'hidden text-sm';

      const data = new FormData(form);
      const affiliationTypes = [...form.querySelectorAll<HTMLInputElement>('input[name="affiliation"]:checked')]
        .map(el => el.value);

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.get('email'),
            firstName: data.get('first_name'),
            lastName: data.get('last_name'),
            organization: data.get('organization'),
            academicUnit: data.get('academic_unit'),
            affiliationTypes,
          }),
        });

        if (res.ok) {
          form.innerHTML = '<p class="text-sm text-emerald-600 font-medium py-2">You\'re subscribed! Thank you.</p>';
        } else {
          throw new Error('subscribe failed');
        }
      } catch {
        status.textContent = 'Something went wrong. Please try again or email us at carte@utoronto.ca';
        status.className = 'text-sm text-red-600';
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  document.addEventListener('astro:page-load', setupContactForm);
</script>
```

### Step 4.3: Verify locally

```bash
npm run dev
```

Navigate to `http://localhost:4321/contact`. Open the "Subscribe to Newsletter" accordion. Open DevTools → Network tab, fill in all fields and submit. Verify:
- POST to `/api/subscribe` appears with correct JSON body
- All fields present: `email`, `firstName`, `lastName`, `organization`, `academicUnit`, `affiliationTypes` array
- Error message appears (subscribe-api not running locally — expected)
- Button re-enables after error

### Step 4.4: Commit

```bash
git add src/pages/contact.astro
git commit -m "feat: update contact page newsletter form to use Resend subscribe API"
```

---

## Task 5: CI/CD Pipeline

**Files:**
- Modify: `.github/workflows/deploy.yml`

### Step 5.1: Update `deploy.yml`

Replace the entire contents of `.github/workflows/deploy.yml` with:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  IMAGE_NAME_LOWER: carte-toronto/carte-website

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}

      - uses: docker/build-push-action@v5
        with:
          context: ./subscribe-api
          push: true
          tags: ghcr.io/carte-toronto/carte-website-subscribe-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            mkdir -p ~/carte

      - name: Copy infra files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          source: "infra/docker-compose.yml"
          target: "~/carte"
          strip_components: 1

      - name: Deploy
        uses: appleboy/ssh-action@v1
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_AUDIENCE_ID: ${{ secrets.RESEND_AUDIENCE_ID }}
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          envs: GITHUB_REPOSITORY,RESEND_API_KEY,RESEND_AUDIENCE_ID
          script: |
            cd ~/carte

            # Write env file for subscribe-api
            printf "RESEND_API_KEY=%s\nRESEND_AUDIENCE_ID=%s\n" "$RESEND_API_KEY" "$RESEND_AUDIENCE_ID" > .env

            # Deploy
            docker compose pull web subscribe-api
            docker compose up -d web subscribe-api

            # Prune old images
            docker image prune -f

      - name: Health check
        run: |
          echo "Waiting for deployment to stabilize..."
          sleep 30
          curl -fL --retry 5 --retry-delay 15 https://carte.utoronto.ca/

```

### Step 5.2: Verify GitHub secrets are set

Before merging, confirm in the GitHub repo (Settings → Secrets and variables → Actions) that both secrets exist:
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`

If either is missing, add it now using the values from the Resend dashboard before proceeding.

### Step 5.3: Commit

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: deploy subscribe-api in CI/CD pipeline"
```

---

## Final Verification

After the deploy workflow completes successfully:

- [ ] Open `https://carte.utoronto.ca` and submit the Hero newsletter form with a real email address
- [ ] Check the Resend dashboard (Audiences → your audience → Contacts) — the contact should appear within a few seconds
- [ ] Verify `first_name`, `last_name`, `organization`, `academic_unit`, and `affiliation_type` are populated correctly on the contact record
- [ ] Open `https://carte.utoronto.ca/contact`, expand the Newsletter section, and repeat the test with a different email
- [ ] Verify the success message ("You're subscribed! Thank you.") appears inline on both forms
