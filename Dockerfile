# The workbench in production: the Angular app built once, served by Caddy,
# which also forwards /api/agent1, /api/agent2 and /api/eval to the agents
# (see Caddyfile) and gets the HTTPS certificate by itself.
# Built and run by docker-compose.yml in the kqml-deploy folder.

# ── 1. build the app (Node is needed only here, not in the final image) ──────
FROM node:20-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# ── 2. serve it ──────────────────────────────────────────────────────────────
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist/geoquery-agent-workbench/browser /srv/ui
