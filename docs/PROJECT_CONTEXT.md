# PROJECT_CONTEXT.md

Status: Phase 1 — Documentation baseline. This file is the top-level orientation document for any future Claude Code session working on this repository. Read this first, then the other files in `docs/` as needed for the area you're touching.

## What this application is

Meridian PRMS ("Meridian Health – Hospital Dashboard") is a hospital administration system covering: patients, doctors, nurses, receptionists, appointments, medical records, payments/billing, a hospital services catalog, and activity-log analytics. Internal project name in `metadata.json` is "Meridian Health - Hospital Dashboard"; `package.json` name is the generic scaffold name `react-example` (NOT CONFIRMED to have been renamed — this is a leftover from the original AI Studio scaffold).

## Current architecture (one sentence)

A single Node process (`server.ts`) runs an Express API under `/api/v1`, and either proxies to a Vite dev server (development) or serves the pre-built React SPA as static files with an `index.html` fallback (production) — frontend and backend are **not currently separated**, which is the subject of the planned Phase 2 migration.

## Technology stack (confirmed from `package.json`, `docker-compose.yml`, `vite.config.ts`, `tsconfig.json`)

- **Frontend**: React 19.0.1, Vite 6.2.3, TailwindCSS 4.1.14 (via `@tailwindcss/vite`), `lucide-react` (icons), `recharts` (charts), `motion` (animation), `pdfjs-dist` (in-browser PDF viewing), `socket.io-client` 4.8.3.
- **Backend**: Express 4.21.2, TypeScript 5.8.2 (run via `tsx` in dev, bundled via `esbuild` for production), Mongoose 9.9.0 (MongoDB ODM), `jsonwebtoken` 9.0.3, `bcryptjs` 3.0.3, `zod` 4.4.3 (backend-only validation), `helmet` 8.3.0, `cors` 2.8.6, `express-rate-limit` 8.6.1, `morgan` 1.11.0, `compression` 1.8.1, `cookie-parser` 1.4.7, `socket.io` 4.8.3.
- **Database**: MongoDB, connected via Mongoose. This is the database being replaced by PostgreSQL in the future migration.
- **Build/dev tooling**: Vite (frontend bundling + dev middleware), `esbuild` (bundles `server.ts` to `dist/server.cjs` for production), `tsc --noEmit` used only for type-checking (`npm run lint`), no test runner configured.
- **Unused dependency**: `@google/genai` is present in `package.json` but `.env`'s own comment states `GEMINI_API_KEY` is "not currently used by any code in this project" — confirmed unused via code search. Do not assume any Gemini/AI integration exists.
- Two lockfiles exist side by side: `bun.lock` and `package-lock.json`. NOT CONFIRMED which package manager is authoritative.

## Repository layout (top level)

```
server.ts                 — process entry point (Express + Vite/static bootstrap)
index.html                — Vite SPA shell
src/
  main.tsx                — React root render
  App.tsx                 — single monolithic app-shell component (~2,100 lines)
  types.ts                — shared frontend TypeScript types
  components/             — all React UI components (flat, no subfolders, no src/pages)
  data/mockData.ts         — frontend demo/mock dataset (independent of backend seeder)
  services/                — apiClient.ts, socketClient.ts, departmentService.ts (localStorage-only)
  utils/                   — demoMode.ts, receiptGenerator.ts (frontend-only helpers)
  modules/                 — backend business modules (see ARCHITECTURE.md)
    {analytics,appointments,auth,doctors,medical-records,nurses,patients,payments,receptionists,services,users}/
      *.routes.ts, *.controller.ts, *.service.ts, *.repository.ts, *.validation.ts, models/*.model.ts
  routes/index.ts          — aggregates all module routers under /api/v1
  shared/
    config/env.config.ts   — Zod-validated environment config
    database/              — connection.ts, seeder.ts, db-guard.ts, memory-store.ts
    errors/                — AppError + subclasses
    middleware/             — auth, validate, error, not-found, rate-limiter, request-logger
    socket.ts               — Socket.IO server init
    constants/, types/, utils/
docs/                       — THIS documentation set (new in Phase 1)
dist/                       — checked-in build output (can go stale relative to src/)
docker-compose.yml          — references a Dockerfile that does not exist in the repo (NOT CONFIRMED to be intentional)
```

## Who the users are (roles)

Exactly five roles exist, defined once in `src/modules/users/models/user.model.ts:3`: `Super Admin`, `Doctor`, `Nurse`, `Receptionist`, `Patient`. See `AUTH_RBAC.md` for the full permission matrix. Note: the frontend additionally defines a second, inconsistent role vocabulary (`src/types.ts` — lowercase `UserRole` and a titlecase `RoleType` that includes a `Billing Officer` value not present in the backend enum). This inconsistency is documented, not resolved, in this phase.

## Relationship to the planned migration

This repository is the **pre-migration baseline**. The long-term plan (see `MIGRATION_PLAN.md`) is to:
1. Separate frontend and backend into independently deployable applications.
2. Replace MongoDB/Mongoose with PostgreSQL.
3. Preserve the current UI/UX and API contracts as closely as possible throughout.

No migration work has started. This documentation set exists so that a future session does not need to re-derive this understanding from scratch.

## How to use the rest of `docs/`

| File | Use it when you need to... |
|---|---|
| `ARCHITECTURE.md` | Understand the overall frontend/backend structure and request flow |
| `API_CONTRACTS.md` | Look up an endpoint's method, auth, roles, body/response shape |
| `DATABASE_SCHEMA.md` | Look up a Mongoose model's fields, indexes, and relationships |
| `AUTH_RBAC.md` | Understand login/token/refresh/reset flow and the role permission matrix |
| `VALIDATION.md` | Find out which layer validates a given field or endpoint |
| `ENVIRONMENT.md` | Look up an environment variable's purpose and where it's read |
| `DEMO_MODE.md` | Understand what changes when `ENABLE_DEMO_MODE` is true/false |
| `UI_UX_RULES.md` | Confirm what must NOT change during migration work |
| `MIGRATION_PLAN.md` | See the full phase roadmap |
| `MIGRATION_PROGRESS.md` | Check what phase we're currently in |
| `DECISIONS.md` | Check an already-approved architectural decision before proposing an alternative |

## Known issues (see individual docs for detail; not fixed in this phase)

Security, architecture, and data-integrity issues discovered during inspection are documented inline in the relevant file, each marked `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`. Do not silently fix any of these while doing later migration work unless the specific phase you are in explicitly approves it.
