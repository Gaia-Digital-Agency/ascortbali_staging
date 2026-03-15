# Ascort Bali

- README.md creation date: February 24, 2026
- GitHub remote name: `origin`
- GitHub remote URL: `git@github.com-net1io:Gaia-Digital-Agency/ascortbali_staging.git`
- Developed by Gaida.com
- Copyright (C) 2026

## App Title
Ascort Bali

## App Introduction
Ascort Bali is a comprehensive, multi-role web platform designed for creator listings and service discovery. It provides a public, filterable directory of creators, integrated advertising placements, and distinct, authenticated portals for administrators, creators, and users. The application facilitates seamless interaction between users and creators, offering features such as service booking, favorite management, and secure user authentication.

## App Features
- Homepage (`/`)
  - Ad panels (`home-1`, `home-2`, `home-3`)
  - Creator service listings with gallery images
  - Advanced filtering (nationality, orientation, age, height, etc.)
  - Pagination for browsing services
- Admin (`/admin`, `/admin/logged`)
  - Secure login
  - Management of homepage ad images and links
  - Oversight of user and creator accounts
- Creator (`/creator`, `/creator/logged`)
  - Secure login and profile management
  - Service management (create, update, feature)
  - Image gallery management for services
- User (`/user`, `/user/logged`, `/user/register`)
  - User registration and login
  - Profile management
  - Favorite services list
  - Order history and management

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

## Storage and Media Paths
- Creator clean images and uploads:
  - `gs://gda-ce01-bucket/baligirls/uploads/`
- Homepage ad images:
  - `gs://gda-ce01-bucket/baligirls/ads/`
- Static assets:
  - `gs://gda-s01-bucket/baligirls/static/`

  <div style="page-break-after: always;"></div>

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

Staging:
- Web: `http://34.124.244.233/baligirls`
- API: `http://34.124.244.233/baligirls/api`

Server (PM2-managed):
```bash
pm2 restart baligirls-api baligirls-web --update-env
pm2 save
```

## Other Relevant Areas
- Base path deployment: app is mounted under `/baligirls`
- Staging host: `34.124.244.233`
- Public media endpoints:
  - `/baligirls/api/clean-image/<filename>`
  - `/baligirls/api/uploads/<object-key>`
- Source data files used in initial data build:
  - `app/data/page_data.json`
  - `app/data/image_data.json`
