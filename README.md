# BaliGirls

- README.md creation date: February 24, 2026
- GitHub remote name: `origin`
- GitHub remote URL: `git@github.com-net1io:Gaia-Digital-Agency/ascortbali_staging.git`
- Developed by Gaida.com
- Copyright (C) 2026

## App Title
BaliGirls

## App Introduction
BaliGirls is a multi-role web application with public creator listings, filtering, ad placements, and authenticated portals for admin, creator, and user workflows.

## App Architecture
- Web app: Next.js (App Router)
- API app: Express.js (REST JSON)
- Database: PostgreSQL
- Storage: Google Cloud Storage (uploads, creator images, ad assets)
- Runtime: PM2 on Linux VM
- Reverse proxy: NGINX (`/baligirls` base path)

## GCP Use (Present)
- Compute Engine VM hosts the app runtime (`baligirls-web`, `baligirls-api` under PM2).
- Cloud SQL hosts PostgreSQL database for users, creators, images, and ad slots.
- Google Cloud Storage hosts media assets.
- Public traffic enters via VM public IP and NGINX routing.

## GCS Use (Present)
- Creator image/upload objects:
  - `gs://gda-ce01-bucket/baligirls/uploads/`
- Homepage ad image objects:
  - `gs://gda-ce01-bucket/baligirls/ads/`
- Static assets:
  - `gs://gda-s01-bucket/baligirls/static/`
- Next.js media routes:
  - `/baligirls/api/uploads/<object-key>` -> streams from GCS
  - `/baligirls/api/clean-image/<filename>` -> resolves creator image from GCS prefix

## App Language and Frameworks
- TypeScript
- React 18
- Next.js 14
- Express 4
- PostgreSQL (`pg`)
- Tailwind CSS
- JWT authentication (EdDSA/Ed25519)

## App File Structure
```text
app/
  web/              # Next.js frontend + API routes for media serving/upload
  api/              # Express REST backend
  data/             # page_data.json, image_data.json
  Assets/
    Admin/          # admin static assets
    Creator/        # creator clean images (legacy/local reference)
database/
  schema.sql
  migrate.py
  seed.py
engine/
  scrape/build/watermark utilities
references/
  operational notes and migration references
```

## App Features
- Homepage (`/`)
  - Ad panels (`home-1`, `home-2`, `home-3`)
  - Creator cards grid
  - Filters (nationality, orientation, age band, height, bust size)
  - Pagination
- Admin (`/admin`, `/admin/logged`)
  - Login
  - Manage homepage ad images and link URLs
  - Manage bottom ad text
  - View creator/user counts
- Creator (`/creator`, `/creator/logged`)
  - Login
  - Manage profile fields
  - Manage image slots (up to 20)
  - File-upload picker dialog for images (browser popup file selector)
- User (`/user`, `/user/logged`, `/user/register`)
  - Login and registration flow entry
  - Manage user profile

## Frontend Features (Present)
- UI/UX: custom themed UI with reusable components
- Mobile view friendly: responsive layouts across pages
- JWT auth: token-based auth with refresh flow
- APIs: REST calls from frontend to backend
- SEO: `robots.txt`, `sitemap.xml`, metadata icons

## System Design Elements (Present)
- Application pattern: Web + API + DB
- Frameworks: Next.js + Express
- Database: PostgreSQL
- Network/protocol: TCP/IP with HTTP(S)
- Port/IP/DNS flow: DNS -> public IP -> NGINX -> app ports (web/api)
- API style: REST (JSON)

## API and Data Flow (VM, GCS, PostgreSQL)
- Browser -> VM (NGINX) -> Next.js (`/baligirls/*`) for pages and media routes.
- Browser/API client -> VM (NGINX) -> Express (`/baligirls/api/*`) for business data.
- Express -> PostgreSQL for auth, profiles, creators, images metadata, and ad slot config.
- Next.js upload route writes bytes to GCS and returns URL:
  - `POST /baligirls/api/upload` -> `gs://.../baligirls/uploads/...` or `gs://.../baligirls/ads/...`
- Next.js media routes read from GCS:
  - `GET /baligirls/api/uploads/<object-key>` -> GCS object stream
  - `GET /baligirls/api/clean-image/<filename>` -> GCS object stream from creator prefix
- Homepage ads use DB-configured paths in `advertising_spaces.image` and render via upload route URLs.

## Storage and Media Paths (Current)
- Creator clean images and uploads:
  - `gs://gda-ce01-bucket/baligirls/uploads/`
- Homepage ad images:
  - `gs://gda-ce01-bucket/baligirls/ads/`
- Static assets:
  - `gs://gda-s01-bucket/baligirls/static/`

## App Compiling Steps
```bash
pnpm install
pnpm --filter @ascortbali/api build
pnpm --filter @ascortbali/web build
```

## App Run Steps
Local:
```bash
pnpm --filter @ascortbali/api dev
pnpm --filter @ascortbali/web dev
```

Server (PM2-managed):
```bash
pm2 restart baligirls-api baligirls-web --update-env
pm2 save
```

## Other Relevant Areas
- Base path deployment: app is mounted under `/baligirls`
- Public media endpoints:
  - `/baligirls/api/clean-image/<filename>`
  - `/baligirls/api/uploads/<object-key>`
- Source data files used in initial data build:
  - `app/data/page_data.json`
  - `app/data/image_data.json`
