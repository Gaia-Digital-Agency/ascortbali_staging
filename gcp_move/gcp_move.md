# GCP Move Checklist (baligirls)

This checklist is for the GCP deployment environment (not local development).

Scope and safety rules:
- This VM hosts multiple apps. Do not modify shared/default config blindly.
- Only change assets for `baligirls`.
- If another app name/path appears, verify before editing or restarting anything.

Environment baseline:
- Project ID: `gda-viceroy`.
- VM: `gda-s01`.
- SSH: `ssh -i ~/.ssh/gda-ce01 azlan@34.124.244.233`.
- Target path: `/var/www/baligirls`.
- Zone: `asia-southeast1-b`.
- Bucket: `gda-s01`, prefix `baligirls/`.
- Cloud SQL PostgreSQL instance: `baligirls`.
- Staging URL:
  - web: `http://34.124.244.233/baligirls`
  - api: `http://34.124.244.233/baligirls/api`

## Step 1 Status (verified on VM: 2026-02-08)

- `hostname`: `gda-s01.asia-southeast1-b.c.gda-viceroy.internal`.
- Existing `/var/www` apps: `02staging`, `ascortbali`, `baligirls`, `html`, `whatsnewasia`.
- Current `/var/www/baligirls` contains only placeholder `index.html` (no deployed app yet).
- Active Node process found:
  - `whatsnewasia` on port `8080`.
- NGINX route updated:
  - `/03staging` replaced by `/baligirls`.
- Initial proxy baseline confirmed for `baligirls`:
  - `/baligirls` -> `127.0.0.1:3001`
  - `/baligirls/api` -> `127.0.0.1:8001`
- Name conflict found in notes: `baligilrs` typo appears once. Use `baligirls` only.

## Step 2 Status (completed on staging: 2026-02-08)

- Code synced to `/var/www/baligirls`.
- Runtime on VM:
  - Node `v20.20.0`
  - PM2 active
  - PNPM installed (`9.12.3`)
- Build completed:
  - API TypeScript build
  - Web Next.js production build
- PM2 services running:
  - `baligirls-api` on `127.0.0.1:8001`
  - `baligirls-web` on `127.0.0.1:3001`
  - existing `whatsnewasia` remains online (untouched)
- Local VM checks:
  - `http://127.0.0.1:8001/health` -> `200`
  - `http://127.0.0.1:3001/baligirls` -> `200`
- Public staging checks:
  - `http://34.124.244.233/baligirls` -> `200`
  - `http://34.124.244.233/baligirls/api/health` -> `200`

## Step 3 Status (completed on staging: 2026-02-08)

- Cloud SQL discovery and access:
  - Enabled `sqladmin.googleapis.com` in project `gda-viceroy`.
  - Confirmed instance: `baligirls` (`asia-southeast1`), public IP `136.110.3.46`.
  - Added authorized network: `34.124.244.233/32` (staging VM public IP).
- Database setup:
  - Created DB `ascortbali` on instance `baligirls`.
  - Ran:
    - `python3 database/migrate.py` -> success
    - `python3 database/seed.py` -> success
      - seeded providers/images and base app rows.
  - Applied additional Prisma model tables (additive, no destructive drop of legacy tables).
- App env (staging):
  - API `DATABASE_URL` points to Cloud SQL (`sslmode=require`).
  - API `CORS_ORIGIN=http://34.124.244.233`.
  - Web `NEXT_PUBLIC_API_BASE_URL=http://34.124.244.233/baligirls/api`.
- Validation:
  - `GET /baligirls/api/health` -> `200`.
  - `GET /baligirls/api/services` -> `200` with JSON payload.
  - PM2 processes stable (`baligirls-api`, `baligirls-web`, `whatsnewasia` all online).
- Security follow-up:
  - Current DB password is still temporary and must be rotated.
  - Prefer private Cloud SQL connectivity (or Auth Proxy) before production cutover.

## Step 4 Status (completed on staging: 2026-02-08)

- API CORS configured to staging web origin:
  - `CORS_ORIGIN=http://34.124.244.233`
- Verified preflight behavior:
  - `Origin: http://34.124.244.233` -> `Access-Control-Allow-Origin: http://34.124.244.233`
  - Unapproved origin does not get echoed in `Access-Control-Allow-Origin`.
- Verified both direct API and NGINX-routed API:
  - `http://127.0.0.1:8001/services` (direct)
  - `http://127.0.0.1/baligirls/api/services` (through NGINX)

## 1) Pre-flight and identity validation (start here)

- Confirm exact app identifier is `baligirls` in all deployment assets.
- Confirm exact GCP project ID (not only display name).
- Confirm zone format (`asia-southeast2-b`) and instance mappings.
- Confirm final production domain(s):
  - web domain
  - API domain (or path-based `/api` on same host)
- SSH to VM and collect a no-impact inventory:
  - existing `/var/www/*` app directories
  - enabled NGINX sites and upstream ports
  - active firewall rules relevant to VM ingress
- Reserve dedicated internal ports for this app only (example):
  - web: `3001`
  - api: `8001`

## 2) Run production mode (not dev)

- Build:
  - `pnpm -r build`
- Start API:
  - `pnpm --filter @ascortbali/api start`
- Start Web:
  - `pnpm --filter @ascortbali/web start`
- Use a process manager (`pm2` or `systemd`) so services auto-restart.

## 3) Configure NGINX + HTTPS

- Create a dedicated NGINX site config for `baligirls` only.
- Route:
  - web app to Next.js service port
  - API paths (`/api`) to Express API service port
- Validate config before reload:
  - `nginx -t`
- Enable HTTPS certificate (Let's Encrypt or managed cert).
- Force HTTP -> HTTPS redirect after successful cert and route validation.

## 4) Point database to Cloud SQL

- Set `DATABASE_URL` to Cloud SQL Postgres.
- Prefer private networking / Cloud SQL connector over public exposure.
- Run once on GCP target DB:
  - `python3 database/migrate.py`
  - `python3 database/seed.py`

## 5) Set CORS for real domain

- In API env:
  - `CORS_ORIGIN=https://<your-web-domain>`
- Must match actual web URL exactly.

## 6) Move uploads to Cloud Storage

- Current upload route stores files locally in `public/uploads`.
- For production durability, switch uploads to Google Cloud Storage bucket.
- Use:
  - bucket `gda-s01`
  - prefix `baligirls/`

## 7) Store secrets securely

- Put DB password, JWT keys, and `ANALYTICS_HMAC_SECRET` in Secret Manager.
- Avoid committing production secrets in files/repo.
- Rotate known temporary password immediately before go-live.

## 8) Firewall and network hardening

- Publicly expose only required ports (typically `80`/`443`).
- Keep app/backend/internal ports private.
- Restrict DB access to private VPC/private IP.
- Re-check that other VM apps remain reachable after rule updates.

## 9) Use stable Node runtime

- Use Node 20 LTS on GCP server.
- Keep Node version consistent across deploy/restart scripts.

## 10) Cutover and rollback

- Before cutover:
  - lower DNS TTL
  - run smoke tests against domain and API
- Cutover:
  - switch DNS
  - verify login, API, uploads, DB writes, CORS
- Rollback readiness:
  - keep previous NGINX config and app release path
  - define rollback triggers (e.g., sustained 5xx/auth failures)
  - keep rollback commands documented and tested

## Notes

- Local and GCP can coexist with separate `.env` values.
- Use:
  - `app/api/.env.gcp.example`
  - `app/web/.env.gcp.example`
  as templates for production env setup.
