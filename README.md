# CARTE website (Astro)

Static Astro build with Tailwind v4 for CARTE (carte.utoronto.ca). Pages live in `src/pages`, shared layouts/components in `src/layouts` and `src/components`, and long-form content in `src/content`.

## Local development
- `npm install`
- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built site locally

## Deployment
- Dockerfile builds the Astro site then serves static assets with Caddy.
- GitHub Actions workflow at `.github/workflows/deploy.yml` builds/pushes the image to GHCR and SSHes to the VM to run it.
- Caddy configuration lives in `Caddyfile`; adjust the domain there if it changes.

### Domain Configuration
- **Primary domain:** `https://carte.utoronto.ca`
- **Redirect:** `www.carte.utoronto.ca` → `carte.utoronto.ca`
- Caddy automatically provisions TLS certificates via Let's Encrypt (ACME HTTP-01 challenge)
- Requires ports 80 (ACME + redirect) and 443 (HTTPS) to be open on the VM

## Notes
- Tailwind config is inline in `src/styles/global.css` (using the Vite plugin in `astro.config.mjs`).
- Content can be updated by editing the Markdown/MDX files under `src/content`; routes are defined in the Astro pages. 
