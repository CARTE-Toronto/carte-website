# Resend Migration — Newsletter Signup

**Date:** 2026-04-22  
**Status:** Approved

## Overview

Migrate the newsletter signup forms from Mailchimp to Resend. The existing site (static Astro + Caddy) is unchanged. A new tiny Node.js API service (`subscribe-api`) is added alongside it to handle form submissions securely, keeping the Resend API key off the client.

---

## Architecture

### New service: `subscribe-api`

A single Node.js file (`subscribe-api/server.mjs`, no npm dependencies) that:
- Listens on internal port 3000
- Accepts `POST /api/subscribe` with a JSON body
- Calls Resend's contacts API to add the contact to the configured Audience
- Returns `{ success: true }` or `{ error: "..." }`

Caddy routes `/api/subscribe` to this service via `reverse_proxy subscribe-api:3000`. All other traffic continues to be served as static files. From the browser's perspective, `/api/subscribe` is same-origin — no CORS needed.

### Deployment

Two containers run instead of one:
- **`web`** — existing Caddy + static files image (unchanged)
- **`subscribe-api`** — new Node.js service image

Both are built and deployed via the existing GitHub Actions workflow, extended to handle the new service.

---

## Request / Response

**Request** (`POST /api/subscribe`):
```json
{
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "organization": "Acme Corp",
  "academicUnit": "Applied Science & Engineering",
  "affiliationTypes": ["Graduate Student", "Faculty"]
}
```

`email` is required. All other fields are optional.

**Resend API call** (`POST /audiences/{RESEND_AUDIENCE_ID}/contacts`):
```json
{
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "unsubscribed": false,
  "properties": {
    "organization": "Acme Corp",
    "academic_unit": "Applied Science & Engineering",
    "affiliation_type": "Graduate Student, Faculty"
  }
}
```

`affiliationTypes` array is joined as a comma-separated string for `affiliation_type`.

**Responses:**
- `200 { success: true }` — contact created
- `400 { error: "Email required" }` — missing email
- `500 { error: "Failed to subscribe" }` — Resend API error

---

## Form Changes

Both `src/components/Hero.astro` and `src/pages/contact.astro` are updated identically:

- `action`, `method`, and `target="_blank"` removed from `<form>`
- Honeypot fields removed (Resend handles spam protection)
- `lastName` field added to `Hero.astro` (currently missing)
- A `<script>` block intercepts submit, sends `fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({...}) })`
- Submit button shows "Subscribing…" and is disabled during the request
- On success: form is replaced with a "You're subscribed!" confirmation message
- On error: inline error message shown, button re-enabled for retry

**Field mapping:**

| Form field | JSON key | Resend field |
|---|---|---|
| `EMAIL` | `email` | `email` |
| `FNAME` | `firstName` | `first_name` |
| `LNAME` | `lastName` | `last_name` |
| `COMPANY` | `organization` | `properties.organization` |
| `MMERGE3` | `academicUnit` | `properties.academic_unit` |
| `group[12960][X]` checkboxes | `affiliationTypes` | `properties.affiliation_type` (comma-joined) |

---

## Files Changed

| File | Change |
|---|---|
| `subscribe-api/server.mjs` | **New** — Node.js API server |
| `subscribe-api/Dockerfile` | **New** — Node 24 Alpine image |
| `src/components/Hero.astro` | Add `lastName` field, switch to `fetch()` |
| `src/pages/contact.astro` | Switch to `fetch()` |
| `Caddyfile` | Add `handle /api/subscribe { reverse_proxy subscribe-api:3000 }` |
| `infra/docker-compose.yml` | Add `subscribe-api` service with `env_file: .env` |
| `.github/workflows/deploy.yml` | Build/push `subscribe-api` image, deploy service, write `.env` on server |

---

## Infrastructure

### `infra/docker-compose.yml` addition
```yaml
subscribe-api:
  image: ghcr.io/carte-toronto/carte-website-subscribe-api:latest
  container_name: carte-subscribe-api
  restart: unless-stopped
  env_file: .env
  networks:
    - carte-net
```

### `Caddyfile` addition (before existing `handle` block)
```
handle /api/subscribe {
    reverse_proxy subscribe-api:3000
}
```

### `deploy.yml` additions
1. Second build/push step — context `./subscribe-api`, image `ghcr.io/carte-toronto/carte-website-subscribe-api:latest`
2. Deploy script writes `.env` from GitHub secrets before `docker compose up`
3. Deploy script pulls and starts `subscribe-api` alongside `web`

### Environment variables
Two variables required on the server (written to `~/carte/.env` by the deploy script):
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`

Both must be added as GitHub secrets before deploying.

---

## Resend Setup Checklist

Before deploying, complete these steps in the Resend dashboard:

- [ ] Create an Audience (Audiences → Create Audience) — copy the Audience ID
- [ ] Create an API key with **Audiences** permission only (API Keys → Create API Key) — copy the key
- [ ] Add `RESEND_API_KEY` as a GitHub secret (repo Settings → Secrets → Actions)
- [ ] Add `RESEND_AUDIENCE_ID` as a GitHub secret

---

## Out of Scope

- The `tags` custom property is not populated at signup — can be added later
- The beta deployment (`Caddyfile.internal`) does not get the subscribe API route
- No email confirmation / double opt-in flow (can be added via Resend later)
- No unsubscribe handling from the website
