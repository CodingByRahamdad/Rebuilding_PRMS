# DEMO_MODE.md

Documents exactly how `ENABLE_DEMO_MODE` currently behaves, end to end. Nothing about this behavior was changed.

## Where it is read

| File | How |
|---|---|
| `src/shared/config/env.config.ts` | Zod schema field, default `'true'`; used by `validateAuthEnvironment()` — strict JWT-secret validation is skipped whenever demo mode is on (see `ENVIRONMENT.md`/`AUTH_RBAC.md`). |
| `src/shared/database/connection.ts` | Picks the Mongo database name: `prms_production` if `ENABLE_DEMO_MODE==='false'`, else `prms_demo` — this **overrides** whatever database name is embedded in `MONGODB_URI` itself. |
| `src/shared/database/db-guard.ts` | `isDemoModeEnabled()` = `process.env.ENABLE_DEMO_MODE !== 'false'`. Used to decide whether `assertDatabaseConnection()` throws a 503 when the DB is unreachable (only enforced when demo mode is OFF) and whether repositories fall back to the in-memory store (only when demo mode is ON and Mongo is unreachable). |
| `src/shared/database/seeder.ts` | Gates which demo data gets seeded (see below). |
| `src/shared/database/memory-store.ts` | Provides an in-process fallback dataset, also demo-mode-aware. |
| `src/modules/auth/auth.service.ts` | `forgotPassword` returns the raw reset token in the response body only when demo mode is on. |
| `src/routes/index.ts` | `GET /api/v1/config` exposes `{ enableDemoMode: process.env.ENABLE_DEMO_MODE !== 'false' }` publicly (no secrets) — this is what the frontend actually uses at runtime. |
| `vite.config.ts` | Defines `import.meta.env.VITE_ENABLE_DEMO_MODE` / `process.env.ENABLE_DEMO_MODE` at build time. |
| `src/utils/demoMode.ts` (frontend) | `isDemoMode()` — checks a runtime flag set from the backend's `/api/v1/config` response first, falls back to the build-time `VITE_ENABLE_DEMO_MODE`/`ENABLE_DEMO_MODE`, and defaults to `true` if neither is available. |

## When `ENABLE_DEMO_MODE` is `true` (the default)

- **Backend**: on `dbConnection.connect()` success, `seedDatabase()` runs. It always ensures a Super Admin (`alex.morgan@prms.hospital`, hardcoded password `Admin123!`) exists — **this happens regardless of the flag** (see next section). Additionally, if demo mode is on and `PatientModel.countDocuments() === 0` (idempotent — will not double-seed), it seeds a full demo dataset: demo Doctor/Nurse/Receptionist/Patient `User`+profile pairs (all sharing the same `Admin123!` password hash), 2 patients, 2 services, 2 appointments, 1 medical record, 2 payments, 2 activity-log entries (all hardcoded literal data in `seeder.ts`).
- If MongoDB is unreachable, `memory-store.ts` provides an equivalent in-process fallback dataset (5 demo users `usr-1..usr-5` with the same `Admin123!` hash, ~25 demo appointments, 14+ demo medical records), so the app remains partially usable without a real database connection.
- `auth.service.forgotPassword` returns the raw password-reset token directly in its API response (see `AUTH_RBAC.md` for the security implication — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`).
- Strict JWT-secret validation (`validateAuthEnvironment` in `env.config.ts`) is skipped — the app will boot with the hardcoded default JWT secrets.
- **Frontend**: `App.tsx` seeds every domain `useState` (`patients`, `doctors`, `nurses`, `receptionists`, `appointments`, `medicalRecords`, `payments`, `activities`) from `src/data/mockData.ts` (a separate ~3,282-line hand-authored dataset, independent of and not synchronized with the backend's own `seeder.ts` data) whenever `isDemoMode()` is true, before attempting to load live data post-login.

## When `ENABLE_DEMO_MODE` is `false`

- **Backend**: `seedDatabase()` still unconditionally ensures the same Super Admin account exists with the same hardcoded `Admin123!` password (`seeder.ts` line ~15-30 — the demo-mode check only gates the *rest* of the seed data, not this bootstrap account). `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: this means even "production mode" as currently implemented does not avoid a default-credentialed admin account; the `.env` file's own comments describe an `npm run create-admin` script as the intended real bootstrap path, but **this script does not exist anywhere in the repository** (`REQUIRES VERIFICATION` — confirmed absent from `package.json` scripts and from any file under `src/`).
- Strict JWT-secret validation is enforced — the app will refuse to start (throws synchronously at module load) if `JWT_SECRET`/`JWT_REFRESH_SECRET` are unset, too short, a known-insecure placeholder, or identical to each other.
- `assertDatabaseConnection()` will throw a 503 (`DatabaseUnavailableError`) on any request if Mongo is unreachable, rather than silently falling back to the in-memory store.
- The database name resolves to `prms_production` instead of `prms_demo`.
- `auth.service.forgotPassword` never includes the raw reset token in its response.
- **Frontend**: `App.tsx` starts every domain `useState` as an empty array/object instead of seeding from `mockData.ts`, and relies on `loadLiveData()` (post-login) to populate real data from the API.

## Mock data sources — two independent sets (documented, not reconciled)

1. **Backend seed data**: `src/shared/database/seeder.ts` (MongoDB path) and `src/shared/database/memory-store.ts` (in-memory fallback path) — these two overlap in intent (same demo accounts/password) but are separate files that must be kept in sync manually if either changes.
2. **Frontend mock data**: `src/data/mockData.ts` — a completely separate dataset (different patient names, different appointment records, etc.) used only for the initial render before/if live data loads. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: these two "demo data" sources do not match each other; a user could see one set of demo patients before login-driven data replaces them, and a different set if they inspect the actual database.

## API fallback behavior in demo mode

`GET /api/health` reports `status: 'OK'` even if the database is disconnected, as long as demo mode is on (`isHealthy = !isProduction || dbStatus.isConnected` in `routes/index.ts`, where `isProduction` here specifically means `ENABLE_DEMO_MODE === 'false'`). This means health-check monitoring behaves differently depending on this flag — `REQUIRES VERIFICATION` if any external monitoring depends on this endpoint's semantics before changing deployment configuration in a later phase.
