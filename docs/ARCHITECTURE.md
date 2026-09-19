# ARCHITECTURE.md

Describes the architecture as of **Phase 2 (frontend/backend separation)**. Phase 1's
pre-migration description is preserved in git history; this document now reflects two
independent applications, `backend/` and `frontend/`, each with its own `package.json` and
`tsconfig.json`. No UI/UX or business logic changed during this split — see
`MIGRATION_PROGRESS.md` for what was verified.

## 1. Process topology

Two independent Node/Vite processes, run in separate terminals:

```
Terminal 1                                Terminal 2
backend/server.ts (port 3000)             frontend/ (Vite dev server, port 5173)
 ├─ createApp()          (backend/src/express-app.ts)
 ├─ http.createServer(app)
 ├─ initSocket(server)   (backend/src/shared/socket.ts) — Socket.IO on the same HTTP server/port as the API
 ├─ dbConnection.connect() (backend/src/shared/database/connection.ts) — MongoDB, non-fatal on failure
 │    └─ seedDatabase()    (backend/src/shared/database/seeder.ts) — only if DB connected
 ├─ app.use(notFoundHandler)
 ├─ app.use(errorHandler)
 └─ server.listen(PORT)                    Vite serves frontend/index.html + frontend/src/**
                                            server.proxy forwards /api and /socket.io → backend
```

In dev, the frontend's own Vite dev server (`frontend/vite.config.ts`) proxies `/api/*` and
`/socket.io/*` requests to the backend (`http://localhost:3000` by default, overridable via
`VITE_DEV_PROXY_TARGET`). This means the browser still sees same-origin requests exactly as it
did pre-split, so `apiClient.ts`'s relative `API_BASE_URL` and `socketClient.ts`'s same-origin
`io()` call needed **no behavioral change** for local dev — only an optional env-driven override
(`VITE_API_BASE_URL` / `VITE_SOCKET_URL`) for a production deployment where frontend and backend
are served from genuinely different hosts with no proxy available.

The backend no longer runs Vite in middleware mode or serves a static SPA build — `server.ts`
was reduced to API + Socket.IO only. The frontend is now a fully standalone Vite app that is
either run via `npm run dev` or built with `npm run build` and hosted by any static file server.

## 2. Express middleware stack (`backend/src/express-app.ts`, `createApp()`)

In order:
1. `app.set('trust proxy', 1)`
2. `helmet({ contentSecurityPolicy: false })` — CSP explicitly disabled (comment: for Vite UI compatibility)
3. `cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','), credentials: true, methods: [GET,POST,PUT,PATCH,DELETE,OPTIONS], allowedHeaders: [Content-Type, Authorization, X-Requested-With] })`
4. `compression()`
5. `cookieParser()`
6. `express.json({ limit: '10mb' })`, `express.urlencoded({ extended: true, limit: '10mb' })`
7. `GET /api/health` (direct probe, registered before rate limiting)
8. `morgan` request logger, then `apiRateLimiter` (mounted on `/api` only)
9. Cache-busting response headers on `/api/v1`
10. `app.use('/api/v1', apiRouter)`

`notFoundHandler`/`errorHandler` are registered in `backend/server.ts` immediately after
`createApp()`; the backend no longer has an SPA catch-all to order around, since the frontend is
a separate process now.

## 3. Backend module layering

Every business domain under `backend/src/modules/<name>/` follows the same file pattern:

```
<name>.routes.ts       — Express Router; wires authenticate/authorize/validate per route
<name>.controller.ts   — thin HTTP layer: parses req, calls service, sends response via ApiResponse helper
<name>.service.ts      — business logic
<name>.repository.ts   — Mongoose query wrapper (find/create/update/delete)
<name>.validation.ts   — Zod schemas for body/query/params
models/<name>.model.ts — Mongoose schema/model
```

Modules present: `analytics`, `appointments`, `auth`, `doctors`, `medical-records`, `nurses`, `patients`, `payments`, `receptionists`, `services`, `users`.

This layering is consistent across all 10 business modules — a strong, reusable pattern to carry forward into any future backend restructuring.

## 4. Route aggregation (`backend/src/routes/index.ts`)

```
GET  /api/v1/health     — public, reports DB connection status
GET  /api/v1/config     — public, exposes only { enableDemoMode: boolean }
/api/v1/auth             → auth.routes.ts
/api/v1/users             → users.routes.ts
/api/v1/doctors           → doctors.routes.ts
/api/v1/nurses            → nurses.routes.ts
/api/v1/receptionists     → receptionists.routes.ts
/api/v1/patients          → patients.routes.ts
/api/v1/appointments      → appointments.routes.ts
/api/v1/medical-records   → medical-records.routes.ts
/api/v1/payments          → payments.routes.ts
/api/v1/services          → services.routes.ts
/api/v1/analytics         → analytics.routes.ts
```

There is **no single centralized authentication gate** applied in `express-app.ts` or `routes/index.ts` — each module router calls `router.use(authenticate)` itself (except `auth.routes.ts`, which applies `authenticate`/`optionalAuthenticate` selectively per route). Full endpoint-by-endpoint detail is in `API_CONTRACTS.md`.

## 5. Frontend architecture

All paths below are now rooted at `frontend/` rather than the old repo-root `src/`. No file
content in `App.tsx` or the component tree was refactored during Phase 2.

- **Entry point**: `frontend/index.html` → `frontend/src/main.tsx` (`createRoot(...).render(<StrictMode><App/></StrictMode>)`) — no providers wrapped around `<App/>`.
- **`frontend/src/App.tsx`** (~2,106 lines) is the entire application shell: authentication bootstrap, all domain state (`useState` per entity: patients, doctors, nurses, receptionists, appointments, medical records, payments, activities), all CRUD handler functions, and a tab-based pseudo-router.
- **No routing library** is used (no `react-router-dom` or equivalent). "Navigation" is a `currentTab: NavigationTab` state variable (`frontend/src/types.ts`) rendered via a chain of `{currentTab === 'x' && <XView/>}` conditionals in `App.tsx`. There is no URL-based routing, no deep links, no browser history integration — the whole app lives at `/`.
- **No global state management library** (no Context API providers, no Redux/Zustand/Jotai, no React Query/SWR). All state is local to `App.tsx` and prop-drilled into ~20 view/modal components. There is no `AuthContext` — auth state (`isAuthenticated`, `currentUser`, `currentRole`, `loadingAuth`) is plain `useState` in `App.tsx`.
- Two `window` custom events act as a lightweight pub/sub substitute for context: `prms_auth_expired` (dispatched by `apiClient.ts` on failed token refresh) and `prms_departments_updated` (dispatched by `departmentService.ts`).
- **Component tree**: flat under `frontend/src/components/` (29 files, no subfolders, no `src/pages`). Categories: shell/layout (`Sidebar.tsx`, `Header.tsx`), auth (`LoginView.tsx`, `AuthProfileView.tsx`), dashboard/analytics (`DashboardView.tsx`, `AnalyticsView.tsx`), one list-view + one Form-modal + one Detail-modal per entity (Patients, Doctors, Nurses, Receptionists — plus `AppointmentsView`, `MedicalRecordsView`, `PaymentsView`, `ServicesView`, `StaffDeptsView` which combine list+detail inline), utility modals (`SearchModal`, `ExportModal`, `MessageModal`), settings (`SettingsView`), and `PdfViewer.tsx` (custom pdf.js viewer for base64 attachments).
- **API/service layer**: `frontend/src/services/apiClient.ts` — a static class wrapping `fetch` (no axios). `API_BASE_URL` defaults to the relative `'/api/v1'` (proxied to the backend in dev by `vite.config.ts`), with an optional `VITE_API_BASE_URL` env override for production deployments on a different host. Handles JWT attach, single-flight 401 refresh-and-retry, and small 60s TTL caches for patients/doctors lists — all unchanged from Phase 1.
- **`frontend/src/services/socketClient.ts`** — thin Socket.IO client wrapper, used for a live activity-log feed. `io()`'s URL is `undefined` by default (same-origin, proxied in dev), with an optional `VITE_SOCKET_URL` override for production.
- **`frontend/src/services/departmentService.ts`** — despite its name, this is NOT a backend-calling service; it stores `Department` data entirely in `localStorage`. There is no backend `departments` module. This is single-browser, non-synchronized state.
- **`frontend/src/data/mockData.ts`** (~3,282 lines) — a separate, hand-authored demo dataset used only on the frontend when demo mode is active; it is not derived from and does not match the backend's own `seeder.ts` demo data (two independent, non-synchronized sources of "demo data" continue to exist). **Note:** the backend's in-memory fallback store (`backend/src/shared/database/memory-store.ts`) also imports `initialPatients`/`initialDoctors` from this same dataset — since frontend and backend are now separate deployable apps with no shared package, this file (and the `Patient`/`Doctor`/etc. types it needs from the old root `src/types.ts`) was **duplicated** into `backend/src/shared/data/mockData.ts` and `backend/src/shared/data/mockData.types.ts` verbatim, so the in-memory fallback store's behavior is unchanged. The two copies are not automatically kept in sync — if `mockData.ts` content is intentionally edited in the future, both copies need the same edit (this mirrors the pre-existing "two independent demo datasets" note above, not a new problem introduced by the split).

## 6. Request flow trace (frontend → database)

```
User action in a View/Modal component
  → calls a method on ApiClient (frontend/src/services/apiClient.ts)
  → fetch() to /api/v1/<module>[/:id] with Authorization: Bearer <token>, credentials:'include'
  → [dev only] Vite dev-server proxy (frontend/vite.config.ts) forwards /api/* to the backend origin
  → Express: helmet/cors/compression/cookieParser/json → morgan → apiRateLimiter
  → apiRouter → <module>.routes.ts: authenticate (JWT verify + re-fetch user/role/status from DB)
       → [authorize(...roles) if this route requires it — writes only, see AUTH_RBAC.md]
       → validate(schema) (Zod, src/shared/middleware/validate.middleware.ts)
  → <module>.controller.ts → <module>.service.ts (business logic)
  → <module>.repository.ts → Mongoose model → MongoDB
  → result flows back up: repository → service → controller → ApiResponse.success/error JSON
  → fetch() resolves in ApiClient → caller's React state (setState in App.tsx or a view component)
  → UI re-renders
```

Reverse flow (DB → UI) is the same path traversed backward; there is no server-driven push for most data (Socket.IO is used only for the activity-log feed — see `DEMO_MODE.md`/`ARCHITECTURE.md` §7).

## 7. Realtime (Socket.IO)

`backend/src/shared/socket.ts`: `initSocket(httpServer)` creates a Socket.IO server with
`cors: { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','), methods: [...] }` —
as of Phase 2 this reads from the same `CORS_ORIGIN` env var as the Express HTTP API (previously
hardcoded to `'*'`), so cross-origin Socket.IO connections work once frontend and backend are on
different ports/hosts. Its auth middleware still reads a token from `socket.handshake.auth.token`
or an `Authorization` header; if present it verifies via the same access-token verification used
by HTTP, attaching `socket.data.user`. **If the token is missing or invalid, the connection is
still allowed to proceed** (`next()` is still called) — Socket.IO authentication is best-effort,
not enforced. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` (unchanged from Phase 1; this split only
made the CORS *origin source* consistent, it did not touch the auth middleware). The only
server→client event found is `activity:new`, broadcast to all connected clients (no
rooms/namespaces); the emitting function `emitActivityLog()` was not confirmed to be invoked from
any activity-creating code path — `REQUIRES VERIFICATION` whether real-time activity broadcast is
actually wired end-to-end. Verified during Phase 2: the frontend's Vite dev-server proxy forwards
the `/socket.io` WebSocket upgrade correctly (`ws: true` in `frontend/vite.config.ts`), and a
manual handshake through the proxy succeeded.

## 8. Build & deployment configuration

- `frontend/vite.config.ts`: plugins `@tailwindcss/vite`, `@vitejs/plugin-react`; path alias `@ → frontend/src` (matches `frontend/tsconfig.json`'s `"@/*": ["./src/*"]`; no code currently imports via this alias); defines `import.meta.env.VITE_ENABLE_DEMO_MODE`/`process.env.ENABLE_DEMO_MODE` at build time; **new in Phase 2** — `server.proxy` forwards `/api` and `/socket.io` (with `ws: true`) to the backend (`VITE_DEV_PROXY_TARGET`, defaulting to `http://localhost:3000`), so dev requests remain same-origin from the browser's perspective.
- `backend/tsconfig.json` / `frontend/tsconfig.json`: split from the old single root `tsconfig.json` — backend's has no DOM lib (Node-only), frontend's keeps DOM/DOM.Iterable and `jsx: "react-jsx"`. Both keep `noEmit: true` (type-checking only; builds use Vite/esbuild, not `tsc`).
- `docker-compose.yml`: **unchanged, not addressed in Phase 2.** It still assumes the pre-split monolithic single-process/single-port structure and still references a `Dockerfile` that does not exist anywhere in this repository (`docker-compose build` would fail as configured, exactly as before the split). A correct setup now needs two services (backend + frontend, each with its own Dockerfile) and container-to-container `CORS_ORIGIN`/proxy wiring — deferred to a future phase, not addressed here. See `MIGRATION_PROGRESS.md`.
- No CI configuration file was found anywhere in the repository. `REQUIRES VERIFICATION` whether one exists outside the inspected tree.

## 9. Cross-origin cookie behavior (verified safe for current dev topology)

The refresh-token httpOnly cookie (set by `backend/src/modules/auth/auth.controller.ts`, unchanged
in Phase 2) continues to work in local dev without any code change: `http://localhost:5173`
(frontend) and `http://localhost:3000` (backend) are different origins (different ports) but the
same **site** (same registrable domain, `localhost`), so the existing `sameSite: 'lax'` cookie
attribute is still sent on `fetch`/XHR requests from the frontend to the backend. This was
verified manually during Phase 2 validation (see `MIGRATION_PROGRESS.md`). If frontend and
backend are ever deployed on genuinely different registrable domains in production (not just
different subdomains/ports of one domain), the cookie's `sameSite`/`secure`/`domain` attributes
would need revisiting (`sameSite: 'none'` + `secure: true`) — that change is explicitly **out of
scope for Phase 2** and must not be made until a dedicated later phase addresses it.
