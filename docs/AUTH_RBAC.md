# AUTH_RBAC.md

Documents the CURRENT authentication and authorization implementation exactly as it exists in code today. No changes were made. Security gaps are flagged inline as `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` for future, explicitly-approved remediation phases.

## Roles

Single source of truth: `src/modules/users/models/user.model.ts:3` — `role: 'Super Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Patient'`. Status enum on the same model: `'Active' | 'On Leave' | 'Inactive'`.

`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: the frontend defines two additional, inconsistent role vocabularies in `src/types.ts` — a lowercase `UserRole` (`admin|doctor|nurse|receptionist|patient`) and a titlecase `RoleType`/`AuthProfile.role` (`Super Admin|Doctor|Nurse|Receptionist|Billing Officer` — note `Billing Officer` does not exist in the backend enum at all, and `Patient` is missing from this second frontend type). These three role vocabularies (backend enum, frontend `UserRole`, frontend `RoleType`) do not agree and are manually cross-mapped with ad-hoc ternary logic in `App.tsx`. Any future consolidation is a Phase 2+ concern.

## Login flow (`POST /auth/login`)

1. `auth.controller.login` → `auth.service.login(email, password)`.
2. `AuthRepository.findByEmailWithPassword` looks up the user (email lowercase-matched); rejects if not found or `status !== 'Active'`.
3. `bcrypt.compare(password, passwordHash)`.
4. On success: signs an access JWT (HS256, `env.JWT_SECRET`, expiry `env.JWT_EXPIRES_IN`, default `15m`) and a refresh JWT (`env.JWT_REFRESH_SECRET`, expiry `env.JWT_REFRESH_EXPIRES_IN`, default `7d`); both tokens embed a `type: 'access'|'refresh'` discriminator checked on verification.
5. Refresh token is (a) stored on `User.refreshToken` (server-side, `select:false`) and (b) set as an httpOnly cookie (`auth.controller.ts` — `httpOnly:true`, `secure` only when `NODE_ENV==='production'`, `sameSite:'strict'` in production / `'lax'` in development, `maxAge` 7 days).
6. Access token is returned **only in the JSON response body** (`{user, accessToken}`), never as a cookie by this backend.

## Token storage (frontend)

`src/services/apiClient.ts`: access token held in a static in-memory field, seeded from and persisted to `localStorage['prms_auth_token']`. Refresh token is never touched by frontend JS — it lives only in the httpOnly cookie, sent automatically via `fetch(..., {credentials:'include'})`.

## Token refresh (`POST /auth/refresh-token`)

`ApiClient.request()` intercepts any `401` response (excluding calls to `/auth/login`, `/auth/refresh-token`, `/auth/logout`) and triggers a single-flight refresh: concurrent 401s are coalesced (`isRefreshing`/`refreshSubscribers` in `apiClient.ts`) into one `POST /auth/refresh-token` call (reads the refresh cookie), then the original request(s) are retried once each. On the backend: `auth.service.refreshToken` verifies the refresh JWT's signature and `type==='refresh'`, then **compares it against the value currently stored on the user's document** — this is refresh-token rotation with single-active-token-per-user storage (issuing a new pair overwrites/invalidates the previous one server-side). There is no separate revocation list/blacklist beyond this stored-value comparison.

## Logout (`POST /auth/logout`)

Uses `optionalAuthenticate` (does not require a currently-valid access token to call). Resolves the target user id from `req.user?.id` if present, else attempts an unverified `jwt.decode` of the refresh token to recover an id. Calls `AuthRepository.updateRefreshToken(userId, null)` — this nulls the stored refresh token (the actual revocation mechanism) and clears the refresh cookie. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: this only revokes the refresh token; a still-unexpired **access** token remains valid and accepted by `authenticate` until its own natural expiry (15 minutes by default) even after logout — there is no access-token blacklist anywhere in the codebase.

## `authenticate` middleware (`src/shared/middleware/auth.middleware.ts`)

Extracts the JWT from the `Authorization: Bearer <token>` header, or falls back to a `req.cookies.accessToken` cookie. `REQUIRES VERIFICATION`/note: no code path in this backend ever actually sets an `accessToken` cookie, so that fallback is currently dead in practice, though harmless. After verifying the signature, it **re-fetches the user's current role/status from the database** (rather than trusting the JWT payload) — this means a Super Admin deactivating or role-changing a user takes effect on that user's very next request, even before their existing access token would naturally expire. Throws `UnauthorizedError` if the user's status is not `Active`. `TokenExpiredError`/`JsonWebTokenError` are both translated into `UnauthorizedError`.

`optionalAuthenticate`: identical extraction/verification, but silently continues with no `req.user` set on any failure — used only by `POST /auth/logout`.

`authorize(...allowedRoles)`: a simple allow-list check of `req.user.role` against the given list; throws `ForbiddenError` (403) if not present. Declared per-route in each module's `*.routes.ts` — see the full matrix below and in `API_CONTRACTS.md`.

## Password handling

- Hashing: `bcryptjs`, `SALT_ROUNDS = 10` (`src/modules/auth/auth.utils.ts`).
- Change password (`POST /auth/change-password`, requires `authenticate`): validates the old password, re-hashes the new one, and nulls the stored refresh token (forces re-login on other sessions). `REQUIRES VERIFICATION`: no frontend UI was found to actually call this endpoint — `AuthProfileView.tsx`'s password-change form shows a success message without making any API call (dead/cosmetic UI feature). `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`.
- Forgot password (`POST /auth/forgot-password`): always returns a neutral message regardless of whether the email exists (anti user-enumeration); generates a 32-byte random token via `crypto.randomBytes`, stores only its SHA-256 hash plus a 15-minute expiry on the user document. **`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`**: when demo mode is enabled (`ENABLE_DEMO_MODE !== 'false'`, which is the schema default), the raw reset token is returned directly in the HTTP response (`auth.service.ts`, comment references "zero-friction demo testing") — this means anyone can request a password reset for any registered email and immediately receive a usable token in the same response, i.e. an account-takeover path if demo mode is ever left on against real data.
- Reset password (`POST /auth/reset-password`): compares the provided token's hash against the stored hash using `crypto.timingSafeEqual` (constant-time comparison — correct practice), checks the 15-minute expiry, updates the password hash, and nulls the refresh token + clears the reset-token fields.
- Registration/self-signup: **no `/auth/register` route exists.** New Patient accounts are only created by staff via `POST /patients` (roles: Super Admin, Receptionist, Nurse); other role accounts only via staff-only `POST /users` (Super Admin). `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: `POST /patients` defaults a newly-created patient's login password to the hardcoded literal `PatientPass123!` if none is supplied.
- Email verification / account-activation workflow: not implemented beyond the manually-settable `status` enum. `NOT CONFIRMED FROM CURRENT CODE.`

## Authorization matrix (as actually enforced server-side)

"Read" below means `GET` list and `GET /:id`. **No module restricts Read by role** — confirmed absent of any `authorize()` call on any `GET` route, and confirmed absent of any `req.user`-based filtering inside any controller/service/repository read path that was inspected (patients, medical-records, payments, appointments, doctors, nurses, receptionists, users all checked). `req.user` is used only to attribute activity-log entries on writes, never to scope reads.

| Module | Create | Update | Delete | Read |
|---|---|---|---|---|
| users | Super Admin | Super Admin | Super Admin | any authenticated |
| doctors | Super Admin, Receptionist | Super Admin, Doctor | Super Admin | any authenticated |
| nurses | Super Admin, Receptionist | Super Admin, Nurse | Super Admin | any authenticated |
| receptionists | Super Admin | Super Admin, Receptionist | Super Admin | any authenticated |
| patients | Super Admin, Receptionist, Nurse | Super Admin, Receptionist, Nurse, Doctor | Super Admin | any authenticated |
| appointments | Super Admin, Receptionist, Doctor, Patient | Super Admin, Receptionist, Doctor | Super Admin, Receptionist, Doctor | any authenticated |
| medical-records | Super Admin, Doctor, Nurse | Super Admin, Doctor | Super Admin, Doctor | any authenticated |
| payments | Super Admin, Receptionist | Super Admin, Receptionist | Super Admin | any authenticated |
| services | Super Admin | Super Admin | Super Admin | any authenticated |
| analytics | Super Admin (manual log POST only) | — | — | any authenticated |

**`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`**: the "any authenticated" Read column above is the single biggest authorization gap in the system — a logged-in Patient can read every other patient's medical/financial records and the full staff directory via the same endpoints staff use, since there is no object-level (row-level) authorization anywhere in the backend. This is documented for future remediation planning; it must NOT be fixed as a side-effect of this or the next migration phase without an explicit, separately-approved security-hardening phase (see `MIGRATION_PLAN.md` Phase 11).

## Frontend role handling (cosmetic only — not real access control)

`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, documented in detail because the UI/UX must be preserved exactly even though it's non-functional as "security":
- `Sidebar.tsx`'s `isTabRestricted()` only decides whether to render a lock icon next to a nav item; `handleTabClick()` never checks it, so clicking a "restricted" tab still navigates there.
- `App.tsx`'s render tree applies no per-tab role gating at all — every authenticated role can open every view.
- `SettingsView.tsx`'s permissions-matrix checkboxes and `AuthProfileView.tsx`'s role-switcher only mutate local React state; neither calls any API; neither has any effect on the real session or its actual backend permissions.
- These behaviors are part of the UI/UX that must be preserved as-is per `UI_UX_RULES.md` — do not "fix" this cosmetic RBAC while doing the frontend/backend separation (Phase 2) unless a separate, explicitly-approved phase asks for it.

## Socket.IO authentication

`src/shared/socket.ts`: reads a token from `socket.handshake.auth.token` or an `Authorization` header; if present and valid, attaches `socket.data.user`. **If the token is missing, or verification throws, the connection is still allowed to proceed** (`next()` is called in the catch branch too) — Socket.IO auth is best-effort/optional, not enforced. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE.`
