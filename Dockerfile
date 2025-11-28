FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
HEALTHCHECK CMD wget -q --spider --no-check-certificate --header="Host: carte.utoronto.ca" https://localhost/ || exit 1

