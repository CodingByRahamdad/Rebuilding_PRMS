# MIGRATION_PROGRESS.md

**Current Phase:** Phase 2 — Frontend/Backend Separation

**Status:** Completed / Pending Review

## Phase 2 record

**Objective:** split the single monolithic app (one `package.json`, one `src/` tree, one Express
process serving both the API and the Vite/static frontend) into two independent applications,
`frontend/` and `backend/`, with zero UI/UX change and zero business-logic change.

### What moved

- Backend (`server.ts`, `src/express-app.ts`, `src/routes/`, `src/modules/*`, `src/shared/*`) →
  `backend/server.ts`, `backend/src/**`, via `git mv` (history preserved).
- Frontend (`index.html`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`,
  `src/types.ts`, `src/components/*`, `src/services/*`, `src/data/*`, `src/utils/*`) →
  `frontend/index.html`, `frontend/vite.config.ts`, `frontend/src/**`, via `git mv`.
- Each app got its own `package.json` (dependencies partitioned by actual usage; `typescript`
  duplicated into both since they're now fully independent — no npm workspaces) and its own
  `tsconfig.json` (backend: Node-only, no DOM lib; frontend: keeps DOM/DOM.Iterable, `jsx:
  "react-jsx"`).
- The old root `package.json`, `package-lock.json`, `bun.lock`, `tsconfig.json`, `dist/`, and the
  now-empty root `src/` and `node_modules/` were removed after both new apps were installed and
  verified working independently.
- The root `.env` (untracked, contained real backend secrets) was **moved, not copied-and-edited**,
  to `backend/.env`. Root now has no `.env` file.

### What changed (minimal, scoped to making separation functional)

- `backend/server.ts`: removed the `createViteServer` middleware-mode branch and the
  `express.static`/SPA-catch-all branch — the backend no longer serves the frontend in any mode.
  Mongo connect/seed, `initSocket`, error handlers, and graceful shutdown are otherwise identical.
- `backend/src/shared/socket.ts`: Socket.IO's CORS origin now reads from `env.CORS_ORIGIN` (same
  source as the Express `cors()` middleware) instead of a hardcoded `'*'`. The pre-existing
  "connection allowed through even without a valid token" auth behavior was **not** touched.
- `frontend/vite.config.ts`: added a `server.proxy` block forwarding `/api` and `/socket.io`
  (`ws: true`) to the backend (`VITE_DEV_PROXY_TARGET`, default `http://localhost:3000`), so dev
  requests stay same-origin from the browser's perspective — no CORS-with-credentials edge cases
  to get right for local dev. Path alias `@` retargeted from the old repo root to `frontend/src`
  (verified: no code anywhere actually imports via `@/`, so this is a no-op safety net).
- `frontend/src/services/apiClient.ts`: `API_BASE_URL` now optionally reads `VITE_API_BASE_URL`
  (unset → identical `'/api/v1'` relative-path behavior as before).
- `frontend/src/services/socketClient.ts`: `io()` now optionally reads `VITE_SOCKET_URL` (unset →
  identical same-origin behavior as before).
- `frontend/src/vite-env.d.ts` (new file): added `/// <reference types="vite/client" />` so
  `tsc --noEmit` recognizes `import.meta.env` — a pre-existing gap (the monolith's single
  tsconfig had no such reference either) that only surfaced once the frontend's own `npm run
  lint` was run standalone; purely a type-declaration addition, no runtime behavior change.
- **Cross-boundary dependency discovered and resolved:** `src/shared/database/memory-store.ts`
  (backend's in-memory Mongo fallback) imported `initialPatients`/`initialDoctors` directly from
  `src/data/mockData.ts` (a frontend file), and that file in turn imported types from the old
  root `src/types.ts` (also frontend-only). Since frontend and backend are now separate apps with
  no shared package, `mockData.ts` and the types it needs were **duplicated verbatim** into
  `backend/src/shared/data/mockData.ts` and `backend/src/shared/data/mockData.types.ts` so the
  backend's in-memory fallback store's behavior is byte-identical to before. The two `mockData.ts`
  copies are not auto-synced — a future intentional edit to the demo dataset needs to be applied
  to both, exactly as the pre-existing "two independent demo datasets" note in `DEMO_MODE.md`
  already describes for the *other* dataset (`seeder.ts` vs `mockData.ts`).

### Package manager

Standardized on **npm** (root had both `bun.lock` and `package-lock.json`, ambiguous; npm is the
safer common denominator for CI/deploy). Each app has its own fresh `package-lock.json`; `bun.lock`
was not carried into either.

### Dependency removed

`@google/genai` was dropped from both new `package.json` files — confirmed unused by any code
(matches the also-unused `GEMINI_API_KEY` env var). Zero functional effect.

### Docker — deferred, not addressed

`docker-compose.yml` was already broken before this phase (references a `Dockerfile` that does
not exist). It still assumes the old monolithic single-service structure and was left as-is; a
correct two-service setup needs a full rework in a later phase. See `ARCHITECTURE.md` §8.

### Validation performed

- `cd backend && npm install && npm run dev` — started cleanly, connected to the real MongoDB
  Atlas cluster referenced in `backend/.env`, Socket.IO initialized, listened on `:3000`.
- `curl http://localhost:3000/api/health` → `200 UP`. `curl http://localhost:3000/api/v1/config`
  → `200 { enableDemoMode: false }` (matches `backend/.env`'s `ENABLE_DEMO_MODE=false`).
- `cd backend && npm run lint` (`tsc --noEmit`) → only 2 pre-existing type errors remain
  (`doctors.repository.ts`, `users.repository.ts`), confirmed via `diff` against the pre-move git
  blobs to be byte-identical files — **not introduced by this phase**, not fixed (per the
  no-bug-fixing rule for Phase 2).
- `cd frontend && npm install && npm run dev` — Vite started cleanly on `:5173`.
- `cd frontend && npm run lint` → clean, zero errors.
- `cd frontend && npm run build` → standalone production build succeeded (one pre-existing
  chunk-size warning, unrelated to the split).
- With both servers running: `curl http://localhost:5173/api/v1/config` through the Vite proxy →
  same `200` response as hitting the backend directly, confirming the proxy works end-to-end.
- CORS preflight: `OPTIONS /api/v1/auth/login` with `Origin: http://localhost:5173` → `204`, with
  `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Credentials:
  true` reflected correctly.
- Socket.IO handshake through the proxy (`GET /socket.io/?EIO=4&transport=polling` via
  `localhost:5173`) → valid Engine.IO handshake response, confirming the WebSocket proxy path
  works.
- Secret-leak check: `grep -r "MONGODB_URI\|JWT_SECRET\|JWT_REFRESH_SECRET" frontend/dist/` → zero
  matches.
- **Not tested:** an actual login/refresh-token/authenticated-CRUD flow through the UI. The
  backend's `backend/.env` points at what appears to be a real/shared MongoDB Atlas database
  (not a local or disposable one) with `ENABLE_DEMO_MODE=false`, and no known valid credentials
  were available — attempting a login would have required either guessing credentials against a
  real database or seeding new data into it, both of which were judged too risky to do
  unprompted. **This is a known gap** — the user should manually verify login → refresh-token →
  logout → an authenticated dashboard load in a browser before treating Phase 2 as fully closed.

## Known issues / remaining risks

- Login/refresh-token/logout/dashboard-load flow was not manually exercised end-to-end through
  the browser (see above) — please verify this manually.
- `docker-compose.yml` is stale and will need a full two-service rework in a later phase.
- The two pre-existing Socket.IO issues (permissive-by-default auth middleware; the fact that its
  CORS config is a separate block from Express's, now at least reading the same env var) remain
  exactly as documented in `ARCHITECTURE.md` §7 — intentionally not fixed in this phase.
- The two pre-existing `doctors.repository.ts`/`users.repository.ts` type errors remain —
  intentionally not fixed in this phase.
- `backend/src/shared/data/mockData.ts` is now a duplicate of `frontend/src/data/mockData.ts`;
  future edits to the demo dataset must be applied to both copies.
- Cross-origin refresh-cookie behavior was verified safe for the current same-registrable-domain
  local dev topology (`localhost:5173` ↔ `localhost:3000`) but was not re-verified for any
  genuinely cross-domain production deployment — out of scope for this phase.

## Phase 1 record (for history)

## Record of what was done in Phase 1

- Git baseline: already created by the project owner prior to this phase (`git status` confirmed a clean working tree on `main`, up to date with `origin/main`, before any documentation files were added).
- Current architecture documented → `ARCHITECTURE.md`
- Current frontend documented → `ARCHITECTURE.md` §5–6, `UI_UX_RULES.md`
- Current backend documented → `ARCHITECTURE.md` §2–4, §8
- Current MongoDB schema documented → `DATABASE_SCHEMA.md`
- API contracts documented → `API_CONTRACTS.md`
- Auth/RBAC documented → `AUTH_RBAC.md`
- Validation documented → `VALIDATION.md`
- Environment documented → `ENVIRONMENT.md`
- Demo mode documented → `DEMO_MODE.md`
- UI/UX preservation rules documented → `UI_UX_RULES.md`
- Migration roadmap documented → `MIGRATION_PLAN.md`
- Architectural decisions recorded → `DECISIONS.md`

## Method

Inspection was performed by direct reading of source files (`server.ts`, `src/express-app.ts`, `src/routes/index.ts`, `src/shared/config/env.config.ts`, `src/modules/users/models/user.model.ts`, `src/types.ts`, `package.json`, `docker-compose.yml`, `.env`) plus three prior deep-dive exploration passes covering, respectively: (1) the full frontend component tree, routing/state approach, and API client behavior; (2) backend middleware, all 10 business modules' routes/controllers/services, RBAC enforcement, and Socket.IO; (3) every Mongoose model's fields/indexes/relationships, Zod validation wiring, environment/Docker/config files, and the full endpoint inventory. Findings were cross-checked against direct file reads before being written into `docs/`.

## Files created in this phase

```
docs/PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/API_CONTRACTS.md
docs/DATABASE_SCHEMA.md
docs/AUTH_RBAC.md
docs/VALIDATION.md
docs/ENVIRONMENT.md
docs/DEMO_MODE.md
docs/UI_UX_RULES.md
docs/MIGRATION_PLAN.md
docs/MIGRATION_PROGRESS.md   (this file)
docs/DECISIONS.md
```

## Application files modified

NONE. This phase was inspection and documentation only; no application source file was edited, refactored, renamed, or deleted.

## NEXT PHASE

Phase 3 — Separation Verification, followed by the remaining phases in `MIGRATION_PLAN.md`
(PostgreSQL design, etc.).

**Phase 3 has NOT been started.** It requires a separate, explicit request before any code is touched.
