# Buttons API

This document lists all the buttons in the Ascort Bali application, their location, action, and the corresponding API endpoint.

## Components

### `BuyButton.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| CREATE ORDER | Service detail page | Creates a new order for a service. | `POST /orders` |

### `AuthNavButton.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGIN | Navigation bar | Redirects to the user login page. | N/A |
| REGISTER | Navigation bar | Redirects to the user registration page. | N/A |
| EDIT PROFILE | Navigation bar | Redirects to the appropriate profile page based on the user's role. | N/A |
| LOGOUT | Navigation bar | Clears authentication tokens and logs the user out. | N/A |

### `FavoriteButton.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| FAVORITE | Service detail page | Adds a service to the user's favorites. | `POST /me/favorites/:serviceId` |

## Pages

### `app/services/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| SEARCH | Service listing page | Submits the filter form. | `GET /services` (with query parameters) |

### `app/admin/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGIN | Admin login page | Submits the login form. | `POST /auth/login` |
| FORGOT PASSWORD | Admin login page | Opens a dialog to start the password recovery process. | `POST /auth/recover` |
| VERIFY | Admin login page (password recovery) | Verifies the recovery code. | `POST /auth/recover-verify` |
| RESET PASSWORD | Admin login page (password recovery) | Resets the password. | `POST /auth/recover-reset` |

### `app/user/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGIN | User login page | Submits the login form. | `POST /auth/login` |
| FORGOT PASSWORD | User login page | Opens a dialog to start the password recovery process. | `POST /auth/recover` |
| VERIFY | User login page (password recovery) | Verifies the recovery code. | `POST /auth/recover-verify` |
| RESET PASSWORD | User login page (password recovery) | Resets the password. | `POST /auth/recover-reset` |

### `app/user/logged/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGOUT | User dashboard | Logs the user out. | N/A |
| SAVE | User dashboard | Saves the user's profile. | `PUT /me` |
| CHANGE PASSWORD | User dashboard | Changes the user's password. | `PUT /me/password` |

### `app/user/register/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| REGISTER | User registration page | Submits the registration form. | `POST /auth/register` |

### `app/admin/logged/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGOUT | Admin dashboard | Logs the admin out. | N/A |
| SAVE | Admin dashboard (bottom ad text) | Saves the bottom ad text. | `PUT /admin/ads/bottom` |
| CLEAR | Admin dashboard (bottom ad text) | Clears the bottom ad text. | `DELETE /admin/ads/bottom` |
| CHANGE PASSWORD | Admin dashboard | Changes the admin's password. | `PUT /me/password` |
| SAVE | Admin dashboard (user management) | Saves a user's details. | `PUT /admin/users/:id` |
| CANCEL | Admin dashboard (user management) | Cancels editing a user's details. | N/A |
| EDIT | Admin dashboard (user management) | Starts editing a user's details. | N/A |
| DELETE | Admin dashboard (user management) | Deletes a user. | `DELETE /admin/users/:id` |
| SAVE | Admin dashboard (creator management) | Saves a creator's details. | `PUT /admin/creators/:id` |
| CANCEL | Admin dashboard (creator management) | Cancels editing a creator's details. | N/A |
| EDIT | Admin dashboard (creator management) | Starts editing a creator's details. | N/A |
| DELETE | Admin dashboard (creator management) | Deletes a creator. | `DELETE /admin/creators/:id` |
| SAVE | Admin dashboard (ad management) | Saves an ad slot. | `PUT /admin/ads/:slot` |
| CLEAR | Admin dashboard (ad management) | Clears an ad slot. | `DELETE /admin/ads/:slot` |

### `app/creator/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGIN | Creator login page | Submits the login form. | `POST /auth/login` |
| FORGOT PASSWORD | Creator login page | Opens a dialog to start the password recovery process. | `POST /auth/recover` |
| VERIFY | Creator login page (password recovery) | Verifies the recovery code. | `POST /auth/recover-verify` |
| RESET PASSWORD | Creator login page (password recovery) | Resets the password. | `POST /auth/recover-reset` |

### `app/creator/register/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| REGISTER | Creator registration page | Submits the registration form. | `POST /auth/register` |

### `app/creator/logged/page.tsx`

| Button | Location | Action | API |
|---|---|---|---|
| LOGOUT | Creator dashboard | Logs the creator out. | N/A |
| SAVE PROFILE | Creator dashboard | Saves the creator's profile. | `PUT /me` |
| CHANGE PASSWORD | Creator dashboard | Changes the creator's password. | `PUT /me/password` |
| CANCEL | Creator dashboard (deactivate account) | Cancels the deactivation process. | N/A |
| DEACTIVATE | Creator dashboard (deactivate account) | Deactivates the creator's account. | `DELETE /me` |
| DELETE | Creator dashboard (image management) | Deletes an image. | `DELETE /me/images/:index` |
| CHOOSE FILE | Creator dashboard (image management) | Opens a file picker to upload an image. | `POST /upload` |
