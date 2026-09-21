# ENVIRONMENT.md

Documents every environment variable actually read by the application, confirmed from `backend/src/shared/config/env.config.ts`, `backend/src/shared/middleware/rate-limiter.middleware.ts`, `backend/src/shared/database/connection.ts`/`db-guard.ts`, `frontend/vite.config.ts`, and `docker-compose.yml`. **No real secret values are reproduced here** — actual values live only in `backend/.env` (relocated from the repository root during Phase 2 — see below) and must stay there; treat any secret-shaped value as `<REDACTED>`.

## Phase 2 changes to environment handling

- The single root `.env` was **relocated to `backend/.env`** (file move, values untouched) — every variable it held was backend-only; no `VITE_`-prefixed variables existed in it. Root no longer has a `.env` file.
- Two new example files exist: `backend/.env.example` and `frontend/.env.example`, replacing any prior single example file. `.gitignore`'s existing `.env*` / `!.env.example` rule already covers both locations — no `.gitignore` change was needed.
- `APP_URL` and `GEMINI_API_KEY` were **dropped from `backend/.env.example`** — both were confirmed unused by any code (see below); this is a documentation/example cleanup, not a functional change, since the real `backend/.env` file itself is untouched and may still contain them harmlessly.
- Three new frontend-only variables were introduced, all optional with dev-safe defaults: `VITE_API_BASE_URL`, `VITE_SOCKET_URL` (production-only overrides; unset in dev, where the Vite proxy handles same-origin routing), and `VITE_DEV_PROXY_TARGET` (overrides the dev-server proxy's backend target, default `http://localhost:3000`).
- `backend/.env.example`'s `CORS_ORIGIN` now defaults to `http://localhost:5173` (the frontend's Vite dev port) instead of `*`, reflecting that frontend and backend are now separate origins. The real `backend/.env` file's existing `CORS_ORIGIN=*` value was left untouched (it already resolves to `origin: true`, which works correctly with credentialed cross-origin requests) — only the example file's guidance changed.

## Backend-only secrets (must never reach the frontend bundle)

| Variable | Purpose | Where read | Default if unset | Notes |
|---|---|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `env.config.ts` (Zod default), `connection.ts` | `mongodb://127.0.0.1:27017/prms` | The actual `.env` in this repo currently contains a live-looking MongoDB Atlas URI with an embedded username/password. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` — flagged for credential rotation outside of this documentation task; not modified here. |
| `JWT_SECRET` | Signs/verifies access tokens | `env.config.ts` | hardcoded fallback `DEFAULT_JWT_SECRET` (a well-known placeholder string committed in source) | `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: the app boots with this default whenever `NODE_ENV !== 'production'` **and** `ENABLE_DEMO_MODE !== 'false'` (i.e. the default dev/demo configuration). |
| `JWT_REFRESH_SECRET` | Signs/verifies refresh tokens | `env.config.ts` | hardcoded fallback `DEFAULT_JWT_REFRESH_SECRET` | Same caveat as `JWT_SECRET`. |
| `JWT_EXPIRES_IN` | Access token TTL | `env.config.ts` | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `env.config.ts` | `7d` | |
| `RATE_LIMIT_WINDOW_MS` | Global API rate-limit window | `env.config.ts`, `rate-limiter.middleware.ts` | `900000` (15 min) | |
| `RATE_LIMIT_MAX` | Global API rate-limit max requests/window | `env.config.ts`, `rate-limiter.middleware.ts` | `10000` (schema default; repo's own `.env` overrides to `500`) | Applies to ALL `/api` traffic, including auth endpoints — see next row. |
| `AUTH_RATE_LIMIT_MAX` | *Documented* as a stricter limit for `/auth/login`, `/auth/refresh-token`, `/auth/forgot-password`, `/auth/reset-password` | **Nowhere** — confirmed via repo-wide search, this variable is read by no `.ts` file | n/a | `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: documented in `.env` comments but never implemented; auth endpoints currently share the generic global rate limit only. |
| `ENABLE_DEMO_MODE` | Toggles demo seeding/behavior (see `DEMO_MODE.md`) | `env.config.ts`, `db-guard.ts`, `connection.ts`, `seeder.ts`, `routes/index.ts` (`/config`), `vite.config.ts` (build-time) | `'true'` | Also read directly as `process.env.ENABLE_DEMO_MODE` in several files rather than via the validated `env` object — `REQUIRES VERIFICATION` whether this indirection matters for any future refactor. |
| `NODE_ENV` | Standard Node environment flag | `env.config.ts`, `server.ts`, `error-middleware.ts`, cookie `secure`/`sameSite` logic | `development` | |
| `PORT` | HTTP server port | `env.config.ts`, `server.ts` | `3000` | |

## Frontend-safe / build-time variables

| Variable | Purpose | Where read | Notes |
|---|---|---|---|
| `VITE_ENABLE_DEMO_MODE` / `import.meta.env.VITE_ENABLE_DEMO_MODE` | Build-time demo-mode flag consumed by the frontend | `frontend/vite.config.ts` (defines it), `frontend/src/utils/demoMode.ts` (reads it as a fallback) | The frontend's authoritative source for demo mode at runtime is actually the backend's `/api/v1/config` response, not this build-time flag — see `DEMO_MODE.md`. **Phase 3 correction**: setting `VITE_ENABLE_DEMO_MODE` in `frontend/.env` currently has **no effect on its own** — `vite.config.ts`'s `define` block unconditionally overwrites `import.meta.env.VITE_ENABLE_DEMO_MODE` at build time based on a *different*, plain (non-`VITE_`-prefixed) OS environment variable, `ENABLE_DEMO_MODE`, read from `process.env` at the moment `vite`/`vite build` runs (defaulting to demo-ON whenever that shell variable is not exactly `'false'`). This was verified by reading `vite.config.ts` directly; `frontend/.env.example`'s documentation of `VITE_ENABLE_DEMO_MODE` as the operative control is therefore misleading as currently built — see `MIGRATION_PROGRESS.md` Phase 3, Test 6 for the full analysis and the recommended (not-yet-applied) fix. |
| `VITE_API_BASE_URL` | **New in Phase 2.** Optional absolute backend URL prefix for `apiClient.ts` | `frontend/src/services/apiClient.ts` | Unset in dev (Vite proxy handles routing); only needed in production when frontend/backend are on genuinely different hosts with no proxy. |
| `VITE_SOCKET_URL` | **New in Phase 2.** Optional absolute backend URL for the Socket.IO client | `frontend/src/services/socketClient.ts` | Same as above — unset in dev, production-only override. |
| `VITE_DEV_PROXY_TARGET` | **New in Phase 2.** Dev-server-only proxy target for `/api` and `/socket.io` | `frontend/vite.config.ts` (config-eval time only — never bundled into the browser) | Defaults to `http://localhost:3000` if unset. |
| `DISABLE_HMR` | Disables Vite HMR/watch (AI-Studio-hosting-specific convenience) | `frontend/vite.config.ts` | Not a normal app-level concern. |

`APP_URL` was dropped from `backend/.env.example` in Phase 2 — no code reference to
`process.env.APP_URL` or `import.meta.env.APP_URL` was found; treat as unused.

## Explicitly NOT frontend-safe (do not ever expose to client bundle)

`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and by extension any value derived from them. None of these are referenced anywhere under `frontend/src/components`, `frontend/src/services`, `frontend/src/utils`, `frontend/src/App.tsx`, or `frontend/src/main.tsx` — confirmed backend-only usage. Verified in Phase 2: a production `frontend` build (`npm run build`) was grepped for `MONGODB_URI`/`JWT_SECRET`/`JWT_REFRESH_SECRET` and the real Atlas credential substring — zero matches.

## `GEMINI_API_KEY`

Was present in the old root `.env` with an explicit comment: "only needed if you actually wire up Gemini API calls somewhere in the app. Not currently used by any code in this project." Confirmed via search: no code references it, and the `@google/genai` package was removed from both new `package.json` files during Phase 2 (see `DECISIONS.md`). Document as unused; do not assume any AI/Gemini integration exists in the current application. Dropped from `backend/.env.example`.

## `CORS_ORIGIN`

| Aspect | Value |
|---|---|
| Read by | `env.config.ts`, consumed in `backend/src/express-app.ts` (`cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','), credentials: true, ... })`) and, **new in Phase 2**, `backend/src/shared/socket.ts` (same expression) |
| Schema default | `'*'` |
| Current `backend/.env` value | `'*'` (untouched by Phase 2 — resolves to `origin: true`, which reflects any request origin and works correctly with `credentials: true`) |
| `backend/.env.example` value | `http://localhost:5173` (documents the recommended explicit value for a real separated-origin setup) |
| `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` | Combining a wildcard origin with `credentials:true` is a permissive configuration that should only be used for local development — the repo's `docker-compose.yml` also sets `CORS_ORIGIN=*` in what it labels a "production" configuration (`NODE_ENV=production`), contradicting that guidance. Documented, not changed. |

Socket.IO (`backend/src/shared/socket.ts`) **as of Phase 2** reads the same `CORS_ORIGIN` env var
as the Express HTTP API (previously it had its own separate, hardcoded `cors: { origin: '*' }`
configuration, entirely independent of the env var). This was the one CORS-related code change
made in Phase 2 — it was necessary for cross-origin Socket.IO connections to work once frontend
and backend became separate processes, and does not touch the pre-existing Socket.IO auth
middleware issue noted in `ARCHITECTURE.md` §7 (`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`).

## `docker-compose.yml` environment handling

**Unchanged in Phase 2** — deferred to a future phase along with the rest of the Docker rework (see `ARCHITECTURE.md` §8 and `MIGRATION_PROGRESS.md`). All backend env vars for the `prms-app` service (`NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `ENABLE_DEMO_MODE`) are hardcoded directly in the compose file rather than injected via a `.env` file or secrets manager. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` — real-looking secret values are committed in plaintext in this file, and the `mongo:7.0` service in the same file has no authentication configured (`MONGO_INITDB_ROOT_USERNAME`/`PASSWORD` absent). Also note: `docker-compose.yml` references `build: { dockerfile: Dockerfile }`, but **no `Dockerfile` exists anywhere in this repository** — `docker-compose build` would currently fail as configured. `REQUIRES VERIFICATION` whether a Dockerfile was intended to exist and was simply not committed.

## Summary: variables that exist in `backend/.env` vs. variables actually consumed by code

| In `.env`? | Consumed by code? | Variable |
|---|---|---|
| Yes | Yes | `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `ENABLE_DEMO_MODE` |
| Yes (real `.env`, dropped from `.env.example`) | **No** | `AUTH_RATE_LIMIT_MAX` (documented but unimplemented — see above), `GEMINI_API_KEY`, `APP_URL` |
| No (new in `frontend/.env.example`) | Yes | `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_DEV_PROXY_TARGET` |
