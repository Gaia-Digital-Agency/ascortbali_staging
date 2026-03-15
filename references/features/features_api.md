# Implemented Feature Summary

Current implemented feature set for the deployed `ascortBali` app.

## Public Site

- Homepage under `/`
- Creator listing cards driven by provider data
- Filtering controls for creator discovery
- Ad placement display for `home-1`, `home-2`, `home-3`, and bottom text slot
- Public creator preview pages under `/creator/preview/[id]`
- Legal pages under `/terms` and `/privacy`
- Age-gate modal / first-visit consent flow

## User Flows

- User registration with email-based login
- User login and forgot-password reset flow
- User profile edit page under `/user/logged`
- Auth-aware navigation and logout
- Service detail page can create orders through `BuyButton`

## Creator Flows

- Creator registration
- Creator login and forgot-password reset flow
- Creator profile management under `/creator/logged`
- Creator image slot management
- Creator activation/deactivation state stored through profile updates
- Public creator preview rendering from provider/profile/image data

## Admin Flows

- Admin login and forgot-password reset flow
- Admin dashboard under `/admin/logged`
- User account management
- Creator account management
- Ad slot management
- Basic stats and analytics/status visibility

## API Capability Areas

- Authentication and token refresh
- User profile CRUD
- Creator profile CRUD
- Creator image CRUD
- Ads listing and admin ad management
- Public creator listing/detail APIs
- Service listing/detail APIs
- Order creation and payment recording
- Visitor analytics capture and auth-linked analytics events

## Not Included Here

- Detailed endpoint lists are documented separately in `buttons_api.md` and `auto_api.md`.
- Data model notes are documented separately in `schema.md`.
