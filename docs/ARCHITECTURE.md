# ARCHITECTURE.md

Describes the CURRENT (pre-migration) architecture exactly as implemented. Nothing in this document has been changed to prepare for migration.

## 1. Process topology

One Node process, started by `server.ts`:

```
server.ts
 ├─ createApp()                     (src/express-app.ts) — builds the Express app
 ├─ http.createServer(app)
 ├─ initSocket(server)              (src/shared/socket.ts) — attaches Socket.IO to the same HTTP server
 ├─ dbConnection.connect()          (src/shared/database/connection.ts) — MongoDB, non-fatal on failure
 │    └─ seedDatabase()             (src/shared/database/seeder.ts) — only if DB connected
 ├─ if NODE_ENV !== 'production':
 │    createViteServer({middlewareMode:true}) and app.use(vite.middlewares)  — dev: Vite handles the SPA
 │  else:
 │    express.static(dist/) + catch-all res.sendFile(index.html) for non-/api paths — prod: serve built SPA
 ├─ app.use(notFoundHandler)
 ├─ app.use(errorHandler)
 └─ server.listen(PORT)
```

Frontend and backend currently **share the same HTTP server and port**. This is the primary structural fact the Phase 2 (frontend/backend separation) migration must address.

## 2. Express middleware stack (`src/express-app.ts`, `createApp()`)

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

`notFoundHandler`/`errorHandler` are registered later, in `server.ts`, **after** the Vite/static SPA middleware — this ordering is intentional so unmatched `/api/*` paths still return a JSON 404 instead of falling through to `index.html` (the SPA catch-all explicitly checks `req.path.startsWith('/api')` and calls `next()` in that case).

## 3. Backend module layering

Every business domain under `src/modules/<name>/` follows the same file pattern:

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

## 4. Route aggregation (`src/routes/index.ts`)

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

- **Entry point**: `index.html` → `src/main.tsx` (`createRoot(...).render(<StrictMode><App/></StrictMode>)`) — no providers wrapped around `<App/>`.
- **`src/App.tsx`** (~2,106 lines) is the entire application shell: authentication bootstrap, all domain state (`useState` per entity: patients, doctors, nurses, receptionists, appointments, medical records, payments, activities), all CRUD handler functions, and a tab-based pseudo-router.
- **No routing library** is used (no `react-router-dom` or equivalent). "Navigation" is a `currentTab: NavigationTab` state variable (`src/types.ts`) rendered via a chain of `{currentTab === 'x' && <XView/>}` conditionals in `App.tsx`. There is no URL-based routing, no deep links, no browser history integration — the whole app lives at `/`.
- **No global state management library** (no Context API providers, no Redux/Zustand/Jotai, no React Query/SWR). All state is local to `App.tsx` and prop-drilled into ~20 view/modal components. There is no `AuthContext` — auth state (`isAuthenticated`, `currentUser`, `currentRole`, `loadingAuth`) is plain `useState` in `App.tsx`.
- Two `window` custom events act as a lightweight pub/sub substitute for context: `prms_auth_expired` (dispatched by `apiClient.ts` on failed token refresh) and `prms_departments_updated` (dispatched by `departmentService.ts`).
- **Component tree**: flat under `src/components/` (30 files, no subfolders, no `src/pages`). Categories: shell/layout (`Sidebar.tsx`, `Header.tsx`), auth (`LoginView.tsx`, `AuthProfileView.tsx`), dashboard/analytics (`DashboardView.tsx`, `AnalyticsView.tsx`), one list-view + one Form-modal + one Detail-modal per entity (Patients, Doctors, Nurses, Receptionists — plus `AppointmentsView`, `MedicalRecordsView`, `PaymentsView`, `ServicesView`, `StaffDeptsView` which combine list+detail inline), utility modals (`SearchModal`, `ExportModal`, `MessageModal`), settings (`SettingsView`), and `PdfViewer.tsx` (custom pdf.js viewer for base64 attachments).
- **API/service layer**: `src/services/apiClient.ts` — a static class wrapping `fetch` (no axios). Hardcoded `API_BASE_URL = '/api/v1'` (relative path, assumes same-origin deployment — relevant to the Phase 2 separation). Handles JWT attach, single-flight 401 refresh-and-retry, and small 60s TTL caches for patients/doctors lists.
- **`src/services/socketClient.ts`** — thin Socket.IO client wrapper, used for a live activity-log feed.
- **`src/services/departmentService.ts`** — despite its name, this is NOT a backend-calling service; it stores `Department` data entirely in `localStorage`. There is no backend `departments` module. This is single-browser, non-synchronized state.
- **`src/data/mockData.ts`** (~3,282 lines) — a separate, hand-authored demo dataset used only on the frontend when demo mode is active; it is not derived from and does not match the backend's own `seeder.ts` demo data (two independent, non-synchronized sources of "demo data" currently exist).

## 6. Request flow trace (frontend → database)

```
User action in a View/Modal component
  → calls a method on ApiClient (src/services/apiClient.ts)
  → fetch() to /api/v1/<module>[/:id] with Authorization: Bearer <token>, credentials:'include'
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

`src/shared/socket.ts`: `initSocket(httpServer)` creates a Socket.IO server with `cors: { origin: '*', methods: [...] }` — a separate, wider-open CORS configuration than the HTTP API's. Its auth middleware reads a token from `socket.handshake.auth.token` or an `Authorization` header; if present it verifies via the same access-token verification used by HTTP, attaching `socket.data.user`. **If the token is missing or invalid, the connection is still allowed to proceed** (`next()` is still called) — Socket.IO authentication is best-effort, not enforced. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE.` The only server→client event found is `activity:new`, broadcast to all connected clients (no rooms/namespaces); the emitting function `emitActivityLog()` was not confirmed to be invoked from any activity-creating code path — `REQUIRES VERIFICATION` whether real-time activity broadcast is actually wired end-to-end.

## 8. Build & deployment configuration

- `vite.config.ts`: plugins `@tailwindcss/vite`, `@vitejs/plugin-react`; path alias `@ → project root` (matches `tsconfig.json`'s `"@/*": ["./*"]`); defines `import.meta.env.VITE_ENABLE_DEMO_MODE`/`process.env.ENABLE_DEMO_MODE` at build time; no `server.proxy` config for `/api` (unnecessary today since Vite runs in Express middleware mode on the same server — this will become necessary once frontend/backend are separated).
- `tsconfig.json`: target ES2022, module ESNext, `moduleResolution: "bundler"`, JSX `react-jsx`, `noEmit: true` (type-checking only; the actual build uses Vite + esbuild, not `tsc`).
- `docker-compose.yml`: two services — `prms-app` (build from a **`Dockerfile` that does not exist anywhere in this repository** — `REQUIRES VERIFICATION`/`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, `docker-compose build` would currently fail as configured) exposing port 3000, and `mongo:7.0` exposing 27017 with no authentication configured on the Mongo container itself. Both env vars (including JWT secrets and the Mongo URI) are hardcoded in plaintext directly in the compose file — see `ENVIRONMENT.md`.
- No CI configuration file was found anywhere in the repository. `REQUIRES VERIFICATION` whether one exists outside the inspected tree.

## 9. What Phase 2 (frontend/backend separation) will need to change

Documented here for planning purposes only — **not to be executed in this phase**:
- `ApiClient`'s hardcoded relative `API_BASE_URL = '/api/v1'` assumes same-origin; a separated frontend will need this to be a full URL (env-driven).
- The single Express process that both serves the SPA and the API will need to drop the Vite-middleware-mode/static-SPA-serving branch of `server.ts` entirely once the frontend is deployed separately.
- CORS configuration (`src/express-app.ts` and `src/shared/socket.ts`) will need a real, explicit origin list instead of `*`, since same-origin credentialed requests will no longer apply.
- The refresh-token httpOnly cookie's `sameSite`/domain behavior will need re-verification once frontend and backend are on different origins/ports.
