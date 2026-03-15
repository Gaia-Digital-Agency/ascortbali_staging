# Application Architecture

## App Architecture
- Web app: Next.js (App Router)
- API app: Express.js (REST JSON)
- Database: Prisma + PostgreSQL
- Storage: Google Cloud Storage (uploads, creator images, ad assets)
- Runtime: PM2 on Linux VM
- Reverse proxy: NGINX (`/baligirls` base path)

## App File Structure
```text
app/
  web/              # Next.js frontend + API routes for media serving/upload
  api/              # Express REST backend
    prisma/           # Prisma schema, migrations, and seed scripts
  data/             # page_data.json, image_data.json
  Assets/
    Admin/          # admin static assets
    Creator/        # creator clean images (legacy/local reference)
```
