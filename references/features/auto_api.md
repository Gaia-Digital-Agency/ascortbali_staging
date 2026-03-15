# Auto API

This document lists all the APIs that are called automatically without direct user intervention. These APIs are typically called within `useEffect` hooks to fetch initial data or perform background tasks.

| API Endpoint | Location | Purpose |
|---|---|---|
| `GET /ads` | `components/AdvertisingSpaces.tsx` | Fetches the list of advertisements to be displayed on the homepage. |
| `POST /analytics/beacon` | `components/AnalyticsBeacon.tsx` | Sends analytics data to the server. |
| `GET /me` | `components/AuthNavButton.tsx` | Checks if the user is currently logged in and fetches their role. |
| `GET /me` | `app/user/logged/page.tsx` | Fetches the profile information of the logged-in user. |
| `GET /services/:id` | `app/services/[id]/ServiceDetailClient.tsx` | Fetches the details of a specific service. |
| `GET /creators/:id` | `app/creator/preview/[id]/CreatorPreviewClient.tsx` | Fetches the public profile of a specific creator. |
| `GET /admin/users` | `app/admin/logged/page.tsx` | Fetches the list of all users for the admin dashboard. |
| `GET /admin/creators` | `app/admin/logged/page.tsx` | Fetches the list of all creators for the admin dashboard. |
| `GET /admin/ads` | `app/admin/logged/page.tsx` | Fetches the list of all advertisements for the admin dashboard. |
| `GET /me` | `app/creator/logged/page.tsx` | Fetches the profile information of the logged-in creator. |
| `GET /me/images` | `app/creator/logged/page.tsx` | Fetches the images of the logged-in creator. |
