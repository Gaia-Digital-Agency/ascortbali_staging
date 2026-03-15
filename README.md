# Ascort Bali

- README.md creation date: February 24, 2026
- GitHub remote name: `origin`
- GitHub remote URL: `git@github.com-net1io:Gaia-Digital-Agency/ascortbali_staging.git`
- Developed by Gaida.com
- Copyright (C) 2026

## Overview

Ascort Bali is a staged multi-role web application mounted under `/baligirls`.

Primary stack:

- Next.js web app in `app/web`
- Express API in `app/api`
- PostgreSQL
- Google Cloud Storage for media
- PM2 + NGINX on the staging VM

Detailed current-state technical reference is maintained in:

- `references/features/Inventory.md`
- `references/features/architecture.md`
- `references/features/auto_api.md`
- `references/features/buttons_api.md`
- `references/features/features_api.md`
- `references/features/schema.md`

## App Compiling Steps
```bash
pnpm install
pnpm -r build
```

## App Run Steps
Local:
```bash
pnpm --filter @ascortbali/api dev
pnpm --filter @ascortbali/web dev
```

Staging:
- Web: `http://34.124.244.233/baligirls`
- API: `http://34.124.244.233/baligirls/api`

Server (PM2-managed):
```bash
pm2 restart baligirls-api baligirls-web --update-env
pm2 save
```

## Repo Notes

- Base path deployment: app is mounted under `/baligirls`
- Staging host: `34.124.244.233`
- Monorepo workspaces: `app/*`, `packages/*`
- Root scripts:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm typecheck`

## Media / Data Notes

- Source JSON files still present for legacy build/import workflows:
  - `app/data/page_data.json`
  - `app/data/image_data.json`
- Current app runtime also uses GCS-backed media routes under:
  - `/baligirls/api/clean-image/<filename>`
  - `/baligirls/api/uploads/<object-key>`
