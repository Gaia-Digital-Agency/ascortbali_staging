# Inventory

This file contains a list of all the code files in the project, their line counts, and a brief description of their purpose.

## Database

| File | Lines of Code | Purpose |
|---|---|---|
| `database/seed.py` | 309 | Seeds the PostgreSQL database with initial data from JSON files. |
| `database/migrate.py` | 43 | A script to handle database migrations. |

## Web Application (`app/web`)

### Middleware

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/middleware.ts` | 41 | Handles request middleware, including authentication and redirects. |

### Application Pages

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/app/creator/register/page.tsx` | 321 | Creator registration page. |
| `app/web/app/creator/logged/page.tsx` | 746 | Logged-in creator dashboard. |
| `app/web/app/creator/preview/[id]/CreatorPreviewClient.tsx` | 128 | Client-side component for creator preview. |
| `app/web/app/creator/preview/[id]/page.tsx` | 192 | Server-side component for creator preview. |
| `app/web/app/creator/page.tsx` | 384 | Creator listing page. |
| `app/web/app/privacy/page.tsx` | 66 | Privacy policy page. |
| `app/web/app/terms/page.tsx` | 166 | Terms of service page. |
| `app/web/app/admin/logged/page.tsx` | 606 | Logged-in admin dashboard. |
| `app/web/app/admin/page.tsx` | 300 | Admin login page. |
| `app/web/app/user/register/page.tsx` | 329 | User registration page. |
| `app/web/app/user/logged/page.tsx` | 305 | Logged-in user dashboard. |
| `app/web/app/user/page.tsx` | 291 | User login page. |
| `app/web/app/layout.tsx` | 80 | Root layout for the web application. |
| `app/web/app/page.tsx` | 270 | Home page of the application. |
| `app/web/app/services/[id]/ServiceDetailClient.tsx` | 151 | Client-side component for service details. |
| `app/web/app/services/[id]/page.tsx` | 15 | Server-side component for service details. |
| `app/web/app/services/page.tsx` | 101 | Service listing page. |

### API Routes

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/app/api/admin-asset/[filename]/route.ts` | 45 | API route to serve admin assets. |
| `app/web/app/api/clean-image/[filename]/route.ts` | 41 | API route to serve clean images. |
| `app/web/app/api/uploads/[...path]/route.ts` | 32 | API route to handle file uploads. |
| `app/web/app/api/static/[...path]/route.ts` | 32 | API route to serve static files. |
| `app/web/app/api/upload/route.ts` | 31 | API route to handle file uploads. |

### Configuration Files

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/next.config.mjs` | 21 | Next.js configuration file. |
| `app/web/next-env.d.ts` | 5 | TypeScript declaration file for Next.js. |
| `app/web/tailwind.config.ts` | 50 | Tailwind CSS configuration file. |
| `app/web/postcss.config.js` | 6 | PostCSS configuration file. |

### Components

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/components/BuyButton.tsx` | 31 | A button component for purchasing services. |
| `app/web/components/CreatorFilterControls.tsx` | 100 | Controls for filtering creators. |
| `app/web/components/AuthNavButton.tsx` | 81 | Navigation button for authentication. |
| `app/web/components/FooterStatus.tsx` | 33 | Footer status component. |
| `app/web/components/AnalyticsBeacon.tsx` | 31 | A component for sending analytics data. |
| `app/web/components/AdvertisingSpaces.tsx` | 178 | A component for displaying advertisements. |
| `app/web/components/AgeGateModal.tsx` | 77 | A modal for age verification. |
| `app/web/components/FavoriteButton.tsx` | 31 | A button for adding services to favorites. |

### Libraries

| File | Lines of Code | Purpose |
|---|---|---|
| `app/web/lib/api.ts` | 92 | API utility functions. |
| `app/web/lib/gcs.ts` | 80 | Google Cloud Storage utility functions. |
| `app/web/lib/paths.ts` | 14 | Path utility functions. |

## API Application (`app/api`)

### Prisma

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/prisma/seed.ts` | 135 | Seeds the database with initial data using Prisma. |

### Scripts

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/scripts/migrate-creator-usernames-email.ts` | 67 | A script to migrate creator usernames to emails. |
| `app/api/scripts/generate-ed25519-keys.mjs` | 11 | A script to generate Ed25519 keys for JWT signing. |
| `app/api/scripts/migrate-creator-temp-passwords.ts` | 35 | A script to migrate temporary passwords for creators. |

### Middleware

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/src/middleware/rateLimit.ts` | 20 | Rate limiting middleware. |
| `app/api/src/middleware/auth.ts` | 30 | Authentication middleware. |

### Types

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/src/types/modules.d.ts` | 2 | TypeScript declaration file for modules. |

### Core

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/src/router.ts` | 29 | Express router configuration. |
| `app/api/src/index.ts` | 44 | Main entry point for the API application. |

### Libraries

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/src/lib/jwt.ts` | 82 | JWT utility functions. |
| `app/api/src/lib/security.ts` | 13 | Security utility functions. |
| `app/api/src/lib/env.ts` | 26 | Environment variable utility functions. |
| `app/api/src/lib/pg.ts` | 33 | PostgreSQL utility functions. |

### Routes

| File | Lines of Code | Purpose |
|---|---|---|
| `app/api/src/routes/analytics.ts` | 255 | API routes for analytics. |
| `app/api/src/routes/admin.ts` | 333 | API routes for admin functionality. |
| `app/api/src/routes/creators.ts` | 99 | API routes for creators. |
| `app/api/src/routes/orders.ts` | 73 | API routes for orders. |
| `app/api/src/routes/ads.ts` | 29 | API routes for advertisements. |
| `app/api/src/routes/me.ts` | 578 | API routes for user profiles. |
| `app/api/src/routes/services.ts` | 131 | API routes for services. |
| `app/api/src/routes/auth.ts` | 549 | API routes for authentication. |

## Packages (`packages`)

### Types

| File | Lines of Code | Purpose |
|---|---|---|
| `packages/types/src/index.ts` | 39 | Shared TypeScript types for the project. |

## Engine (`engine`)

| File | Lines of Code | Purpose |
|---|---|---|
| `engine/scrape_full_image.py` | 382 | A script to scrape full images. |
| `engine/page_scrapper/scrape_page_thumbnail.py` | 298 | A script to scrape page thumbnails. |
| `engine/site_scrapper/scrape_deep.py` | 120 | A script to deeply scrape a site. |
| `engine/site_scrapper/scrape_surface.py` | 131 | A script to perform a surface-level scrape of a site. |
| `engine/remove_watermark.py` | 270 | A script to remove watermarks from images. |
| `engine/build_data.py` | 114 | A script to build data from various sources. |
