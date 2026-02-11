# AscortBali (BaliGirls)

A premium service marketplace platform connecting **Registered Users** with **Creator Users**. Features a dark + gold themed UI, JWT authentication across 3 portals, AI-powered image processing pipeline, and Google Cloud Platform deployment.

---

## 1) Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript |
| **Backend** | Express 4, PostgreSQL via `pg`, JWT (EdDSA/Ed25519) |
| **Database** | PostgreSQL (Cloud SQL on GCP) |
| **Engine** | Python 3 — Selenium scraping, EasyOCR, LaMa inpainting |
| **Storage** | Google Cloud Storage (`gda-s01-bucket`) |
| **Infra** | GCP Compute Engine, NGINX, PM2, Secret Manager |
| **Workspace** | PNPM 9.12.3 monorepo |

---

## 2) Repo Layout

```
AscortBali/
├── app/
│   ├── web/                    # Next.js frontend (port 3000/3001)
│   ├── api/                    # Express API backend (port 4000/8001)
│   ├── data/                   # Derived JSON from engine (page_data, image_data)
│   └── Assets/                 # Local image storage
│       ├── Admin/              # Logo, ad images
│       └── Creator/clean_image/# Cleaned creator images (IM_*.jpg)
├── database/
│   ├── schema.sql              # PostgreSQL schema (6 tables + 1 view)
│   ├── migrate.py              # Schema migration script
│   └── seed.py                 # Data seeding from JSON
├── engine/
│   ├── scrape_full_image.py    # Profile scraper (Selenium + Cloudflare bypass)
│   ├── remove_watermark.py     # Watermark removal (EasyOCR + LaMa)
│   ├── build_data.py           # Builds database-ready JSON
│   ├── page_scrapper/          # Page-level scraping tools
│   ├── site_scrapper/          # Site-wide link discovery
│   └── watermark/              # Watermark images and debug masks
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configs
├── references/                 # Documentation
├── scripts/
│   └── gcs_sync_static_images.sh  # Sync assets to GCS bucket
├── package.json                # Root workspace config
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## 3) Database Schema

**Tables:**
- **`app_accounts`** — Admin and user auth (`id UUID`, `role`, `username`, `password`)
- **`user_profiles`** — Registered user profiles (1:1 with `app_accounts`, CASCADE delete)
- **`providers`** — Creator profiles (`uuid PK`, `provider_id UNIQUE`, extensive profile fields)
- **`provider_images`** — Creator gallery, 7 slots per creator (`sequence_number 1-7`)
- **`advertising_spaces`** — Homepage ad slots (`home-1`, `home-2`, `home-3`, `bottom`)
- **`advertising_space_history`** — Audit trail for ad changes

**View:**
- **`provider_main_image`** — Joins providers with their sequence-1 image

---

## 4) API Routes (Express)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/health` | GET | Health check | None |
| `/auth/login` | POST | Login (admin/user/creator portals) | None |
| `/auth/change-password` | POST | Change password (does not overwrite temp_password) | Required |
| `/auth/refresh` | POST | Refresh access token | None |
| `/auth/logout` | POST | Logout (stateless) | None |
| `/me` | GET | Current user info | Required |
| `/me/user-profile` | GET/PUT | User profile CRUD | User |
| `/me/creator-profile` | GET/PUT | Creator profile CRUD | Creator |
| `/me/creator-images` | GET/POST | Creator image gallery CRUD | Creator |
| `/me/creator-images/:id` | PUT/DELETE | Update/delete image slot | Creator |
| `/creators` | GET | List creators (paginated, with main image) | None |
| `/creators/:uuid` | GET | Creator detail + all images | None |
| `/admin/stats` | GET | Creator/user counts | Admin |
| `/admin/ads` | GET/POST | Ad slot management | Admin |
| `/admin/ads/:slot` | PUT/DELETE | Update/delete ad slot | Admin |
| `/ads` | GET | Public ad slots | None |

**Next.js API Routes:**
- `/api/upload` — Image upload to GCS
- `/api/uploads/[...path]` — Serve uploaded files from GCS
- `/api/admin-asset/[filename]` — Serve admin assets
- `/api/clean-image/[filename]` — Serve cleaned creator images
- `/api/static/[...path]` — Serve static assets from GCS

---

## 5) Frontend Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Homepage — ads + creator grid with filters | No |
| `/admin` | Admin login | No |
| `/admin/logged` | Admin dashboard — ad CRUD, stats | Admin |
| `/user` | User login | No |
| `/user/logged` | User profile CRUD | User |
| `/user/register` | Registration notice | No |
| `/creator` | Creator login | No |
| `/creator/logged` | Creator profile + 7-image gallery CRUD | Creator |
| `/creator/preview/[uuid]` | Creator detail page | No (blurred for non-auth) |
| `/services` | Service catalog (planned) | No |
| `/services/[id]` | Service detail (planned) | No |

---

## 6) Authentication

### Three Portals
- **Admin** (`/admin`) — role: `admin`, validated against `app_accounts`
- **User** (`/user`) — role: `user`, validated against `app_accounts`
- **Creator** (`/creator`) — role: `creator`, validated against `providers`

### JWT Flow
- Algorithm: **EdDSA (Ed25519)**
- Access token: 15 min TTL
- Refresh token: 30 day TTL
- Stored in `sessionStorage` with `localStorage` fallback (better persistence across reloads)
- Protected routes use `requireAuth` + `requireRole` middleware

### Password Fallback + Change Password
- Password change endpoint: `POST /auth/change-password` (does not overwrite `providers.temp_password`)
- Fallback passwords:
  - Admin: `admin123`
  - User: `user123`
  - Creator: `creator123` (plus creator `temp_password`)
- Full rules: `references/fallback_access.md`

---

## 7) Engine Pipeline

The engine produces database-ready data from scraped web content:

```
Step 1: scrape_full_image.py
  Input:  engine/page_source.json (profile URLs)
  Output: page_output.json, info_output.json, image_output.json

Step 2: remove_watermark.py
  Input:  image_output.json → downloads watermarked images
  Process: EasyOCR detects text → LaMa AI inpaints removal
  Output: app/Assets/Creator/clean_image/IM_*.jpg

Step 3: build_data.py
  Input:  info_output.json + clean images directory
  Output: app/data/page_data.json, app/data/image_data.json
```

---

## 8) Data Flow

```
Engine (scrape → watermark removal → build JSON)
  ↓
Database (migrate.py creates schema → seed.py loads JSON)
  ↓
API (Express queries PostgreSQL → returns JSON)
  ↓
Web (Next.js renders pages, images served via GCS or local assets)
```

### Image Serving
- **Local dev:** Images from `app/Assets/Creator/clean_image/`
- **Production:** GCS bucket `gda-s01-bucket`
  - Static assets: `baligirls/static/`
  - Uploads: `baligirls/uploads/`
- **Middleware** rewrites public asset paths to GCS-backed API routes

---

## 9) GCP Infrastructure

| Resource | Details |
|----------|---------|
| **VM** | `gda-s01`, Ubuntu 24.04 LTS, `asia-southeast1-b` |
| **Public IP** | `34.124.244.233` |
| **Cloud SQL** | Instance `baligirls`, IP `136.110.3.46` |
| **GCS Bucket** | `gda-s01-bucket` |
| **Secrets** | Secret Manager (JWT keys, DB password, HMAC secret) |

### Process Management (PM2)
```bash
baligirls-api  → port 8001 (loopback)
baligirls-web  → port 3001 (loopback)
```

### NGINX Routing
- `/baligirls/api/upload|uploads|admin-asset|clean-image|static` → Next.js (3001)
- `/baligirls/api/*` → Express (8001)
- `/baligirls/*` → Next.js (3001)

---

## 10) Local Development

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 16
- PNPM 9.12.3
- Python 3.12 (for engine/database scripts)

### Quick Start
```bash
# 1. Start PostgreSQL
brew services start postgresql@16

# 2. Setup database
export DATABASE_URL=postgresql://ascort:ascort@localhost:5432/ascortbali
python3 database/migrate.py
python3 database/seed.py

# 3. Install dependencies
pnpm install

# 4. Start all services
pnpm dev
# Or individually:
# pnpm --filter @ascortbali/api dev   (port 4000)
# pnpm --filter @ascortbali/web dev   (port 3000)
```

### Test Credentials

| Portal | Username | Password |
|--------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |
| Creator | `callista` | `6282144288224` (or `creator123`) |
| Creator | `mary` | `380669265774` (or `creator123`) |

Creator login:
- Username = creator `name`
- Password = `temp_password` (digits only) OR creator fallback `creator123`
- Creators can change their password after login; `temp_password` is preserved.

Password fallback rules and details: `references/fallback_access.md`.

---

## 11) Deployment

```bash
# 1. Build locally
pnpm install && pnpm -r build

# 2. Sync to VM
rsync -avz --exclude node_modules --exclude .git \
  ./ azlan@34.124.244.233:/var/www/baligirls/

# 3. On VM: install, build, sync assets
pnpm install
pnpm -r build
./scripts/gcs_sync_static_images.sh

# 4. Restart services
pm2 restart baligirls-api baligirls-web && pm2 save
```

### Verify
```bash
curl http://127.0.0.1:8001/health
curl http://34.124.244.233/baligirls
```

---

## 12) Theming

Brand colors, fonts, and visual tokens are in `app/web/tailwind.config.ts`:
- **Theme:** Dark background + gold accent
- **Fonts:** Inter (body), Playfair Display (headings)
- **Custom tokens:** `tracking-luxe`, `shadow-luxe`, grain texture background

Edit the `colors.brand` object to reskin the app.

---

## 13) Implementation Status

| Feature | Status |
|---------|--------|
| PostgreSQL schema + JSON seeding | Done |
| Admin/User/Creator login (JWT) | Done |
| Admin ad CRUD (3 image slots + bottom text) | Done |
| User compulsory profile CRUD | Done |
| Creator profile CRUD | Done |
| Creator 7-image gallery CRUD | Done |
| Homepage creator grid with filters | Done |
| Homepage pagination (50/50/35 baseline) | Done |
| GCS integration (uploads + static) | Done |
| GCP deployment (NGINX + PM2) | Done |
| Analytics endpoints | Stub |
| Services/Orders marketplace | Stub |
| OAuth login | Planned |
| Payment processing | Planned |
| HTTPS / Cloud CDN | Planned |

---

## 14) Security Notes

- JWT with EdDSA (Ed25519) — stateless, secure
- IP addresses hashed with HMAC-SHA256 (privacy-first analytics)
- Secrets in GCP Secret Manager (never in git)
- `.secrets/` directory excluded from version control
- Role-based access control on all protected endpoints
- Rate limiting on auth endpoints
- Ad changes tracked in audit history table
