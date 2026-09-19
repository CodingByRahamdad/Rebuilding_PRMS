# ENVIRONMENT.md

Documents every environment variable actually read by the application, confirmed from `src/shared/config/env.config.ts`, `src/shared/middleware/rate-limiter.middleware.ts`, `src/shared/database/connection.ts`/`db-guard.ts`, `vite.config.ts`, and `docker-compose.yml`. **No real secret values are reproduced here** — actual values live only in the repository's own `.env` file and must stay there; treat any secret-shaped value as `<REDACTED>`.

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
| `VITE_ENABLE_DEMO_MODE` / `import.meta.env.VITE_ENABLE_DEMO_MODE` | Build-time demo-mode flag consumed by the frontend | `vite.config.ts` (defines it), `src/utils/demoMode.ts` (reads it as a fallback) | The frontend's authoritative source for demo mode at runtime is actually the backend's `/api/v1/config` response, not this build-time flag — see `DEMO_MODE.md`. |
| `APP_URL` | Documented in `.env` as "public URL this app is hosted at ... for self-referential links if/when you add them" | `REQUIRES VERIFICATION` — no code reference to `process.env.APP_URL` or `import.meta.env.APP_URL` was confirmed during this audit; treat as currently unused until verified. | |
| `DISABLE_HMR` | Disables Vite HMR/watch (AI-Studio-hosting-specific convenience) | `vite.config.ts` | Not a normal app-level concern. |

## Explicitly NOT frontend-safe (do not ever expose to client bundle)

`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and by extension any value derived from them. None of these are currently referenced anywhere under `src/components`, `src/services`, `src/utils`, `src/App.tsx`, or `src/main.tsx` — confirmed backend-only usage.

## `GEMINI_API_KEY`

Present in `.env` with an explicit comment: "only needed if you actually wire up Gemini API calls somewhere in the app. Not currently used by any code in this project." Confirmed via search: no code references it. Document as unused; do not assume any AI/Gemini integration exists in the current application.

## `CORS_ORIGIN`

| Aspect | Value |
|---|---|
| Read by | `env.config.ts`, consumed in `src/express-app.ts` (`cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','), credentials: true, ... })`) |
| Default | `'*'` |
| Current `.env` value | `'*'` |
| `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` | Combining a wildcard origin with `credentials:true` is a permissive configuration that the `.env`'s own comment says should only be used for local development — the repo's `docker-compose.yml` also sets `CORS_ORIGIN=*` in what it labels a "production" configuration (`NODE_ENV=production`), contradicting that guidance. Documented, not changed. |

Socket.IO (`src/shared/socket.ts`) has its own, separate, hardcoded `cors: { origin: '*' }` configuration — it is not driven by the `CORS_ORIGIN` env var at all. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE.`

## `docker-compose.yml` environment handling

All backend env vars for the `prms-app` service (`NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `ENABLE_DEMO_MODE`) are hardcoded directly in the compose file rather than injected via a `.env` file or secrets manager. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` — real-looking secret values are committed in plaintext in this file, and the `mongo:7.0` service in the same file has no authentication configured (`MONGO_INITDB_ROOT_USERNAME`/`PASSWORD` absent). Also note: `docker-compose.yml` references `build: { dockerfile: Dockerfile }`, but **no `Dockerfile` exists anywhere in this repository** — `docker-compose build` would currently fail as configured. `REQUIRES VERIFICATION` whether a Dockerfile was intended to exist and was simply not committed.

## Summary: variables that exist in `.env` vs. variables actually consumed by code

| In `.env`? | Consumed by code? | Variable |
|---|---|---|
| Yes | Yes | `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `ENABLE_DEMO_MODE` |
| Yes | **No** | `AUTH_RATE_LIMIT_MAX`, `GEMINI_API_KEY`, `APP_URL` (last one `REQUIRES VERIFICATION`) |
