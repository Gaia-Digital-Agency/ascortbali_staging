# Application Architecture

Current deployed architecture for `ascortBali`.

## Runtime Model

- Browser requests are served under the `/baligirls` base path.
- NGINX routes page requests to the Next.js web app and API requests to the Express app.
- The web app also serves media proxy/upload routes used by the frontend.
- PM2 manages the long-running `baligirls-web` and `baligirls-api` processes.

## Main Layers

### Frontend

- Next.js 14 App Router application in `app/web`
- Handles page rendering, auth-aware navigation, upload entry points, and media proxy routes

### Backend

- Express API in `app/api`
- Central router mounts: `auth`, `services`, `me`, `orders`, `analytics`, `ads`, `creators`, `admin`

### Data

- PostgreSQL is the primary application database
- Google Cloud Storage holds uploaded media and ad assets

## Data Access Pattern

The codebase currently uses two backend access styles:

- Direct SQL via `pg` for account, creator, admin, analytics, ads, and profile flows
- Prisma for `services` and `orders`

This is an important maintenance detail: schema or migration work must account for both SQL-first and Prisma-backed areas.

## Deployed Request Flow

```text
Browser
  -> NGINX on VM
    -> Next.js web app for /baligirls/*
    -> Express API for /baligirls/api/*
      -> PostgreSQL for application records
Next.js media/upload routes
  -> Google Cloud Storage
```

## Auth Model

- JWT access/refresh token flow
- Login/register handled by `/auth/*`
- Password change handled by `/auth/change-password`
- Forgot-password flow handled by:
  - `/auth/forgot-password/verify`
  - `/auth/forgot-password/reset`
- Frontend stores auth tokens in session storage and mirrors to local storage as fallback

## Deploy State Assumptions

- Staging host: `34.124.244.233`
- App is expected to be mounted at `http://34.124.244.233/baligirls`
- API is expected under `http://34.124.244.233/baligirls/api`
