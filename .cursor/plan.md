# CARTE Website Deployment Framework

## Architecture

```
GitHub Repo → GitHub Actions → Docker Image → GHCR → SSH Pull → VM (Caddy)
```

Each deploy creates a versioned container image. Caddy serves static files with automatic HTTPS.

---

## Phase 1: Provision UofT ITS VM

### 1.1 Generate SSH key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/carte_deploy -C "carte-github-deploy"
vss-cli key mk ~/.ssh/carte_deploy.pub
```

### 1.2 Deploy Ubuntu 22.04 VM

```bash
vss-cli compute vm mk from-clib \
  --source ubuntu-22.04 \
  --name carte-web \
  --description "CARTE website hosting" \
  --os ubuntu64Guest \
  --memory 2 --cpu 1 --disk 20 \
  --net VL-1584-VSS-PUBLIC \
  --ssh-key carte_deploy
```

### 1.3 DNS Configuration

After VM is provisioned, request DNS record from UofT IT:

- `carte.utoronto.ca` → VM's public IP address

*Caddy needs the domain to point to the server before it can obtain SSL certificates.*

---

## Phase 2: Server Setup

SSH into the VM after provisioning.

### 2.1 Install Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in for group to take effect
```

### 2.2 Firewall

```bash
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw allow OpenSSH && sudo ufw enable
```

### 2.3 Authenticate with GHCR

```bash
# Create a GitHub PAT with read:packages scope, then:
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

---

## Phase 3: Docker Files (in repo)

### Dockerfile

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
HEALTHCHECK CMD wget -q --spider http://localhost:80/ || exit 1
```

### Caddyfile

```caddyfile
{
    # UPDATE: Use a real email for Let's Encrypt notifications
    email carte@utoronto.ca
}

carte.utoronto.ca {
    root * /srv
    file_server

    @astro path /_astro/*
    header @astro Cache-Control "public, max-age=31536000, immutable"

    try_files {path} {path}/ {path}/index.html {path}.html
}
```

### .dockerignore

```
node_modules
dist
.git
.github
*.md
.env*
```

---

## Phase 4: GitHub Actions

### 4.1 Repository Secrets

Go to GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |

|--------|-------|

| `DEPLOY_HOST` | VM's IP address or `carte.utoronto.ca` once DNS is set |

| `DEPLOY_USER` | SSH username from VM provisioning |

| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/carte_deploy` (private key) |

### 4.2 .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

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

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          envs: GITHUB_REPOSITORY
          script: |
            mkdir -p /opt/carte
            cat > /opt/carte/docker-compose.yml << 'EOF'
            services:
              web:
                image: ghcr.io/${{ github.repository }}:latest
                container_name: carte-web
                restart: unless-stopped
                ports:
                  - "80:80"
                  - "443:443"
                volumes:
                  - caddy_data:/data
                  - caddy_config:/config
            volumes:
              caddy_data:
              caddy_config:
            EOF
            cd /opt/carte
            docker compose pull
            docker compose up -d
            docker image prune -f

      - name: Health check
        run: |
          echo "Waiting for deployment to stabilize..."
          sleep 30
          curl -f --retry 3 --retry-delay 10 https://${{ secrets.DEPLOY_HOST }}/ \
            || curl -f --retry 3 --retry-delay 10 http://${{ secrets.DEPLOY_HOST }}/
```

---

## Files to Create

| File | Purpose |

|------|---------|

| `Dockerfile` | Multi-stage: Node 24 build → Caddy serve |

| `Caddyfile` | Static file server + auto-HTTPS config |

| `.dockerignore` | Exclude node_modules, .git, etc. |

| `.github/workflows/deploy.yml` | CI/CD pipeline |

*Note: docker-compose.yml is generated on-server by the deploy script to avoid sync issues.*

---

## Rollback

Every deploy tags the image with its commit SHA. To rollback:

```bash
ssh user@server "cd /opt/carte && \
  sed -i 's/:latest/:COMMIT_SHA/' docker-compose.yml && \
  docker compose pull && \
  docker compose up -d"
```

Or manually edit `/opt/carte/docker-compose.yml` to use a previous tag.

---

## Post-Deploy Checklist

- [ ] VM provisioned and accessible via SSH
- [ ] DNS record created pointing to VM IP
- [ ] Docker installed and GHCR authenticated on VM
- [ ] GitHub secrets configured
- [ ] First push to main triggers successful deploy
- [ ] HTTPS working (Caddy obtained certificate)
- [ ] Update Caddyfile email to real address

---

## Implementation Status

### ✅ Completed

- **Docker Configuration Files Created:**
  - ✅ `Dockerfile` - Multi-stage build (Node 24 → Caddy)
  - ✅ `Caddyfile` - Auto-HTTPS configuration
  - ✅ `.dockerignore` - Build exclusions

- **CI/CD Pipeline:**
  - ✅ `.github/workflows/deploy.yml` - Complete GitHub Actions workflow

- **SSH Keys:**
  - ✅ Generated ed25519 key: `~/.ssh/carte_deploy`
  - ✅ Generated RSA key (backup): `~/.ssh/carte_deploy_rsa`

### 🚫 Blocked / Issues

- **VM Provisioning (Phase 1):**
  - ❌ **SSH Key Upload Failing**: `vss-cli key mk` returns `InvalidParameterValue` error despite correct key format. Tried both ed25519 and RSA keys, various path formats, and inline content. May be an API issue with the VSS service.
  - ❌ **No VM Templates Available**: Content library and template lists are empty. Only Ubuntu 22.04 desktop ISO available (`ubuntu-22.04.5-desktop-amd64`), not server template.

- **Next Steps Required:**
  1. Contact UofT VSS Team (https://utor.cloud/help) to:
     - Report SSH key upload API issue
     - Request access to Ubuntu Server templates or guidance on deployment options
  2. Alternative: Deploy VM manually from ISO and configure as server
  3. Once VM is provisioned, proceed with Phase 2 (server setup) and Phase 4 (GitHub secrets)

### 📋 Pending (Cannot proceed until VM is provisioned)

- Phase 1: VM provisioning and SSH key upload
- Phase 2: Server setup (Docker installation, firewall, GHCR auth)
- Phase 4.1: GitHub repository secrets configuration
- Phase 4.2: First deployment test