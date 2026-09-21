# MIGRATION_PROGRESS.md

**Current Phase:** Phase 4 — PostgreSQL Schema Design

**Status:** Completed

## Phase 4 record

**Objective:** design the complete PostgreSQL schema intended to eventually replace MongoDB, preserving existing application behavior and API contracts. Design only — no PostgreSQL install, no database creation, no migrations, no ORM code, no data migration, no MongoDB/Mongoose replacement, no frontend/UI/API-contract/auth-RBAC changes.

**Method:** re-read all nine Phase 1–3 baseline docs (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `DATABASE_SCHEMA.md`, `AUTH_RBAC.md`, `VALIDATION.md`, `DEMO_MODE.md`, `MIGRATION_PROGRESS.md`, `DECISIONS.md`) and independently re-inspected all 10 Mongoose model files, the Zod validation layer, the seeder, the in-memory fallback store, and the frontend's `types.ts` directly against source, rather than relying solely on the existing `DATABASE_SCHEMA.md` write-up (which was cross-checked and confirmed accurate). Two cross-cutting design decisions — normalize embedded `Mixed` arrays into real tables (vs. JSONB) and use UUID primary keys (vs. bigint) — were confirmed explicitly with the project owner before finalizing the design.

**Findings carried into the design (all previously flagged as `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` in earlier docs, now addressed as schema-level decisions):**
- `Appointment`/`MedicalRecord`/`Payment`'s `Mixed`-typed `patientId`/`doctorId`/`appointmentId` fields (including synthetic placeholder defaults like `PT-####`/`doc-###`) become real, nullable foreign keys with a `legacy_*_ref` text fallback column — see `DATABASE_SCHEMA.md` and `POSTGRESQL_SCHEMA.md`.
- `Patient.strict:false` and its `Mixed`/array fields (`prescriptions`, `reports`, `billingInvoices`, `medicalHistory`, `vitals`) are normalized into dedicated child tables (`prescriptions`, `patient_reports` + `patient_report_attachments`, `invoices`, `patient_visit_history`) or flattened columns (`vitals`).
- `MedicalRecord`'s unused-but-defined `prescriptionSchema`/`labResultSchema` sub-shapes become the basis for real, enforced child tables (`prescriptions`, `lab_results`, `medical_record_attachments`).
- `Nurse.assignedPatientIds` (string array) becomes a `nurse_patient_assignments` junction table — the one array field found to represent a genuine existing many-to-many relationship.
- Date-like string fields get real `DATE`/`TIME`/`TIMESTAMPTZ` types; enum-like fields get `VARCHAR + CHECK` (not native `ENUM`, not lookup tables).
- Several concepts were deliberately **not** resolved and are recorded as open questions in `DECISIONS.md` rather than silently decided: `bloodGroup`/`bloodType` duplication, Payment field drift (`amount` vs Zod-only `totalAmount`/`paidAmount`), the dual-modeled-prescriptions ambiguity (Patient vs MedicalRecord), the `invoices`/`payments` conceptual overlap, whether to keep the new optional `activity_logs.user_id` column, and whether a `departments` table should exist at all.

**Documentation produced/updated this phase:**
- `docs/POSTGRESQL_SCHEMA.md` (new) — full table-by-table column reference (18 tables — corrected from an initial miscount of 17 in the Phase 4 verification pass below) and ER-style relationship overview.
- `docs/DATABASE_SCHEMA.md` — Mongoose baseline left unchanged; appended a new "PostgreSQL design (Phase 4)" section covering ID/date-time/enum strategy, normalization approach, relationships/FKs, auth/security data, demo-mode interaction, and index strategy.
- `docs/MIGRATION_PLAN.md` — Phase 4 entry marked completed with a findings summary; Phase 7 entry expanded with the concrete migration risks this phase identified (legacy-ID backfill strategy, date-string cleanup, `strict:false` live-data audit, bare-string `medicalHistory` wrapping, `nurse_patient_assignments` resolution) and a note that the still-open decisions must be answered before Phase 7 starts.
- `docs/DECISIONS.md` — appended decisions 15–21 (UUID strategy, normalize-not-JSONB, VARCHAR+CHECK enums, nullable-FK-plus-legacy-ref pattern, no `departments` table, denormalized-text-stays-text rationale, `nurse_patient_assignments` junction table) and a new "Open questions raised by Phase 4" section; updated the change log.

**No application source file, dependency, or database object was created, modified, or removed.** `git status` was run before and after this phase; only documentation files changed.

## Phase 4 verification record

**Objective:** perform a final verification pass on the Phase 4 schema design before Phase 5 begins, re-checking it against actual application code (not just the Mongoose model files this time — repositories, services, controllers, the seeder, the in-memory fallback store, and frontend types) and correcting any inaccuracies found. Documentation corrections only — no PostgreSQL install, no database/table/migration/ORM creation, no application code changes.

**Method:** two independent re-verification passes were run directly against source, not against the prior session's summaries. Pass 1 re-read all 10 Mongoose model files line-by-line, confirming exact `unique`/`required`/default/enum/index declarations and confirming no model overrides `_id` (so MongoDB's global `ObjectId` uniqueness guarantee holds for every table). Pass 2 traced actual repository/service/controller code for Payments, ActivityLog, Nurse assignments, and the embedded-array read paths for Patient/MedicalRecord, plus frontend type expectations in `apiClient.ts`/`types.ts`.

**Discrepancy the user flagged, confirmed and fixed:** the Phase 4 final report stated "17 tables" but the design actually specifies **18** (`users, patients, doctors, nurses, nurse_patient_assignments, receptionists, appointments, medical_records, prescriptions, lab_results, medical_record_attachments, patient_reports, patient_report_attachments, invoices, patient_visit_history, payments, services, activity_logs`) — a miscount in the original report, not a design ambiguity. An authoritative numbered list was added to the top of `POSTGRESQL_SCHEMA.md`.

**Additional corrections made (see `DECISIONS.md` items 28–34 for full detail):**
- `nurse_patient_assignments.patient_id` made nullable with a new `legacy_patient_ref` column, matching the pattern already used on `appointments`/`medical_records`/`payments` — the original design would have silently dropped assignment rows whose `assignedPatientIds` string doesn't resolve to a real patient (confirmed a real, not hypothetical, situation via `nurses.repository.ts` demo data).
- `receptionists`' documented indexes corrected — no compound `(department, shift)` index exists in Mongo for this model (that's real only for `nurses`); fixed to two separate single-column indexes.
- `services` was missing an explicit Indexes line in the original draft; added.
- `legacy_mongo_id` uniqueness rule restated precisely: `UNIQUE` and safe on the 10 document-backed tables (verified via MongoDB's `ObjectId` uniqueness guarantee), `NULL` (not merely non-unique) on the 8 tables normalized from array items, which never had a discrete Mongo id.
- Added an explicit note that `ON DELETE CASCADE` on the Doctor/Nurse/Receptionist → User foreign keys is a Postgres-side design choice, not a port of any existing Mongo behavior (Mongo has no cascade concept; the app only ever soft-deletes).
- Added an explicit, cited confirmation that normalizing the embedded arrays preserves the JSON API contract but will require new aggregation/re-nesting logic in the future Phase 6 backend implementation, since today's repository code performs a single embedded-document read with zero assembly logic.

**Open questions resolved/deferred with code evidence (was 6 ambiguously "open," now 2 resolved + 4 explicitly deferred):**
- **RESOLVED** — Payment field drift: confirmed via `payments.validation.ts`/`payments.service.ts`/`payment.model.ts` that Mongoose's default strict mode silently drops `totalAmount`/`paidAmount`/`invoiceNo`/`insuranceProvider`/`claimId` on real-database saves (they only survive in the in-memory demo fallback); the proposed `payments` table (amount/service_name only) is confirmed correct as-is. Surfaced a related **pre-existing application bug** (frontend expects fields that silently vanish server-side outside demo mode) — not caused by or fixed in this phase.
- **RESOLVED** — Dual-modeled prescriptions: confirmed `patients.service.ts`/`medical-records.service.ts` are fully independent code paths with zero cross-reference; design (independent nullable FKs) unchanged, now backed by direct evidence.
- **DEFERRED** — `bloodGroup`/`bloodType` canonicalization: no code evidence found either way.
- **DEFERRED** — `invoices`/`payments` conceptual overlap: not re-investigated beyond the original Phase 4 finding.
- **DEFERRED** — `activity_logs.user_id`: confirmed `actor.id` is available at write time in `activity-logger.ts` but is currently discarded into a display string; populating the column requires an application-code change out of scope for this phase.
- **DEFERRED** — `departments` table: no backend module/collection exists for it; unchanged from the original finding.

**Documentation updated this pass:** `docs/POSTGRESQL_SCHEMA.md`, `docs/DATABASE_SCHEMA.md`, `docs/MIGRATION_PLAN.md`, `docs/MIGRATION_PROGRESS.md` (this record), `docs/DECISIONS.md`. No table was added or removed — this was a correction/clarification pass, not a redesign. No application source file, dependency, or database object was touched. `git status` was run before and after.

## NEXT PHASE

Phase 5 — PostgreSQL Local Database Setup.

**Phase 5 has NOT been started.** It requires a separate, explicit request before any code is touched.

## Phase 3 record

**Objective:** validate that Phase 2's frontend/backend split did not break existing
functionality. Validation only — no refactor, no PostgreSQL work, no security fixes, no UI
changes. This closes the one gap Phase 2 flagged: the real login → refresh → logout flow had
never been exercised.

**Pre-flight note (environment, not code):** stale `tsx`/`vite` processes from an earlier session
were still bound to ports 3000/5173, causing the very first connectivity check to return the old
frontend's static SPA fallback for `/api/v1/config` instead of a proxied response. This was
resolved by killing those leftover OS processes and starting single clean instances; it was
**not** a Phase 2 code issue — re-running the same check against clean instances passed. Both
servers were stopped and their processes force-killed at the end of this phase.

### Test 1 — Basic connectivity: PASS

- `GET http://localhost:3000/api/health` → `200 {status: UP}`.
- `GET http://localhost:3000/api/v1/config` → `200 {enableDemoMode:false}`.
- `GET http://localhost:5173/api/v1/config` (through the Vite proxy) → identical `200` response —
  confirms `server.proxy` in `frontend/vite.config.ts` works correctly against a clean backend
  instance.
- `GET http://localhost:5173/` → `200`, valid HTML shell with `/src/main.tsx` entry script.
- No CORS errors observed on any proxied or direct request (curl-level; no browser DevTools
  console was available in this environment — see UI Regression section for the same limitation).

### Test 2 — Authentication: PASS

Used the Super Admin credential that is unconditionally seeded by
`backend/src/shared/database/seeder.ts` regardless of `ENABLE_DEMO_MODE`
(`alex.morgan@prms.hospital` / `Admin123!`) — this is a credential explicitly present in the
project's own source code, not a guess, per the task's safety requirement. Full flow tested via
curl with a cookie jar, through the Vite proxy:

1. **Login** (`POST /api/v1/auth/login`) → `200`, returned `{user, accessToken}` exactly per
   `API_CONTRACTS.md`.
2. **Access token** → valid JWT returned in the JSON body only (never as a cookie), as documented.
3. **Authenticated request** (`GET /api/v1/auth/me` with `Authorization: Bearer`) → `200`, correct
   sanitized profile.
4. **Refresh** (`POST /api/v1/auth/refresh-token`, cookie-based) → `200`, new access token issued,
   refresh cookie rotated (new `iat`/`exp`) — matches the documented rotation behavior.
5. **Logout** (`POST /api/v1/auth/logout`) → `200`, refresh cookie cleared from the client jar.
6. **Post-logout**: reusing the now-invalidated refresh cookie → `401 "Invalid or revoked refresh
   token."` (correctly rejected). Reusing the **old, still-unexpired access token** → `200`, still
   accepted — this is the pre-existing, already-documented "no access-token blacklist" behavior in
   `AUTH_RBAC.md` (Category C, not a regression, not fixed).

### Test 3 — Cookie / credential flow: PASS (verified via curl cookie jar, not a GUI browser)

- The refresh cookie was written to curl's cookie jar with the `#HttpOnly_localhost` marker,
  confirming the `HttpOnly` flag is set exactly as `AUTH_RBAC.md` documents.
- The cookie was sent automatically on the proxied refresh call (curl's cookie-jar mechanism
  mirrors a browser's automatic same-site cookie attachment via `credentials:'include'`).
- Backend received and validated the cookie correctly (refresh succeeded; see Test 2).
- Logout cleared the cookie (empty jar afterward) and independently invalidated the server-side
  stored refresh token (confirmed by the subsequent 401 on reuse).
- **Limitation**: this was verified at the HTTP-protocol level via curl, which reproduces the same
  cookie semantics a browser would apply for this same-registrable-domain (`localhost`) dev
  topology, but no GUI browser/DevTools session was available in this environment to visually
  confirm `document.cookie` cannot read it. The protocol-level evidence (`HttpOnly` flag present
  in the `Set-Cookie` response, confirmed via curl) is definitive for this check regardless.

### Test 4 — API functionality: PASS

Used the Services module (`/api/v1/services`) as a low-risk, non-patient-data catalog resource,
against the live database (see Known Issues — this Atlas database contains real user records, so
all mutation was scoped to a disposable record created and deleted within the same test):

- **GET** `/api/v1/services` → `200`, correct paginated envelope shape.
- **POST** `/api/v1/services` (Super Admin) → `201`-equivalent success, created a record named
  `PHASE3-VERIFICATION-TEST-DELETE-ME`.
- **PUT** `/api/v1/services/:id` → `200`, field updated correctly, response reflected the change.
- **DELETE** `/api/v1/services/:id` → `200`, confirmed via a follow-up GET that the list is empty
  again — no residual test data left behind.
- All HTTP statuses and response envelopes (`{success, message, data}`) matched
  `API_CONTRACTS.md`. Frontend rendering of this specific sequence was not observed in a live
  browser (see UI Regression limitation); the API-level contract was fully verified.

### Test 5 — RBAC smoke test: PARTIAL (Super Admin live-tested; other roles verified statically only)

- **Super Admin** role behavior was live-tested: successfully performed create/update/delete on a
  Super-Admin-only-gated module (`services`, per `AUTH_RBAC.md`'s matrix), and successfully read
  `/api/v1/users` and `/api/v1/auth/me`.
- **Doctor / Nurse / Receptionist / Patient**: **not live-tested.** This Atlas database is a real,
  previously-used environment containing genuine user accounts (confirmed via an authenticated
  `GET /api/v1/users` call, which returned real-looking non-seed user data) — not an empty or
  disposable demo database. Because `ENABLE_DEMO_MODE=false`, `seeder.ts`'s other four demo
  accounts (`sarah.jenkins@…` Doctor, `clara.oswald@…` Nurse, `david.miller@…` Receptionist,
  `ines.williams@…` Patient) were never created, and no other role's real password is known or
  documented anywhere in the project. Per the task's explicit instruction ("do NOT guess
  credentials against a shared/live database" / "only test what can be safely tested"), these
  roles were **not** live-tested.
- Instead, static verification was performed: every route file carrying `authorize(...)` calls
  for the modules in `AUTH_RBAC.md`'s authorization matrix (`services`, `patients`,
  `appointments`, `auth`, `users` routes) was diffed byte-for-byte (ignoring line-ending
  normalization) against the pre-Phase-2 commit (`38d420d`) — **all are content-identical**, and
  `backend/src/shared/middleware/auth.middleware.ts` (the `authenticate`/`authorize` middleware
  implementation itself) is also content-identical. This is strong evidence the authorization
  matrix survived the separation unchanged, since no route or middleware file was touched by
  Phase 2 beyond the two explicitly-documented edits (`server.ts`, `socket.ts`).
- The previously-documented RBAC gaps (no read-side/object-level authorization; cosmetic-only
  frontend role gating) were **not** re-tested for "fixing" purposes and remain exactly as
  documented in `AUTH_RBAC.md` — out of scope for this phase.

### Test 6 — Demo mode: FINDING — frontend has a real, pre-existing second source of truth

Investigated `backend/.env`'s `ENABLE_DEMO_MODE`, `frontend/src/utils/demoMode.ts`,
`frontend/vite.config.ts`'s `define` block, and `frontend/src/App.tsx`'s consumption of
`isDemoMode()`.

1. **Does the frontend need `VITE_ENABLE_DEMO_MODE`?** In principle no — the frontend already
   fetches the authoritative value from `GET /api/v1/config` on mount
   (`App.tsx:101-104`, `setRuntimeDemoMode(configRes.data.enableDemoMode)`). The build-time
   variable only matters for the brief window before that fetch resolves.
2. **Does it create a second source of truth?** **Yes — confirmed.** `demoMode.ts`'s `isDemoMode()`
   checks a module-level `runtimeDemoMode` override first (set only after the async config fetch
   resolves); until that happens, it falls back to the build-time
   `import.meta.env.VITE_ENABLE_DEMO_MODE` flag, which **defaults to demo-mode-ON** whenever it
   is not the literal string `'false'` (including when it is simply unset).
3. **Can frontend/backend states diverge?** **Yes, and it was reproduced by code inspection in
   this exact repo's current config**: `frontend/vite.config.ts` computes
   `isDemo = process.env.ENABLE_DEMO_MODE !== 'false'` and then uses Vite's `define` to hardcode
   `import.meta.env.VITE_ENABLE_DEMO_MODE` to `'true'` at build time whenever the **plain, non-
   `VITE_`-prefixed** OS environment variable `ENABLE_DEMO_MODE` is not set to `'false'` at the
   moment `vite`/`vite build` runs. No `frontend/.env` file currently exists (confirmed:
   `ls frontend/.env*` shows only `.env.example`), and the shell `ENABLE_DEMO_MODE` variable is
   not set in this dev environment either — so **the frontend's initial state is currently
   demo-mode-ON** (`isDemo` defaults `true`) even though the real backend's
   `backend/.env` has `ENABLE_DEMO_MODE=false`. This was confirmed by reading the code path, not
   assumed.
4. **Which components consume each variable?** `frontend/src/App.tsx`'s nine initial
   `useState(() => isDemoMode() ? initialX : [])` calls (patients, doctors, nurses,
   receptionists, appointments, activities, bedOccupancy, medicalRecords, payments — lines
   174-182) run synchronously on first render, **before** the async config-fetch effect can call
   `setRuntimeDemoMode()`. `loadLiveData()` (called once `isAuthenticated` becomes true, which is
   necessarily after the config fetch has already resolved) always attempts the real API first and
   only preserves demo-seeded state as a fallback if that specific API call fails — so in the
   normal case (successful API calls after login) the divergence self-corrects post-login and is
   not visible to an authenticated user. The window where it could matter is the **pre-login /
   pre-config-fetch render**, and only for state that might be rendered before authentication
   completes.
5. **Is `ENABLE_DEMO_MODE=false` sufficient to disable *backend* demo behavior?** **Yes.**
   `seeder.ts` correctly gates all optional demo-account/demo-data seeding behind
   `process.env.ENABLE_DEMO_MODE === 'false'` (confirmed live: this session's backend logged
   `🔒 [Production Mode] Demo seeding disabled` and the `/services` list was genuinely empty).
   This finding is about the **frontend's own, independent** fallback value, not about whether the
   backend correctly honors its own variable — it does.
6. **Is there a frontend-only mock fallback that could bypass the backend?** **Yes** — the
   `initialPatients`/`initialDoctors`/etc. arrays from `frontend/src/data/mockData.ts`, rendered
   whenever `isDemoMode()` currently evaluates `true`, exist independently of any backend call and
   would display fabricated data in that pre-login/pre-config window regardless of what the
   backend's real `ENABLE_DEMO_MODE` value is.

**Classification: C (known documented issue, pre-existing) / D (needs a future phase to
correct), not a Phase 2 regression.** This exact frontend fallback-default-to-true pattern
(`demoMode.ts`'s precedence chain, `App.tsx`'s synchronous initializers) predates Phase 2
entirely — nothing about the split changed this code. What Phase 2 did add was
`frontend/.env.example` documenting `VITE_ENABLE_DEMO_MODE=true` as if it were the operative
control; in fact, per point 3 above, that literal `.env` value is currently overridden by
`vite.config.ts`'s `define` block, which reads a **different**, undocumented, non-`VITE_`-
prefixed variable (`ENABLE_DEMO_MODE` in the OS shell at build time) — so the documented example
variable does not actually control anything in the current build as configured. **Recommended
smallest fix (not performed in this phase):** in a future dedicated phase, either remove the
`define` block's dependency on the undocumented plain `ENABLE_DEMO_MODE` shell variable (letting
Vite's normal `VITE_`-prefixed `.env` loading control it directly), or document the shell variable
requirement explicitly — whichever is chosen, that phase should also consider initializing
`runtimeDemoMode` synchronously from a value already known at first paint (if one exists) rather
than only after the async config fetch resolves, to close the pre-login divergence window
entirely. **Not attempted here** — this is analysis only, per the "do not redesign demo mode"
instruction.

### Test 7 — mockData.ts duplication: investigated, not removed

- **Locations**: `frontend/src/data/mockData.ts` (original) and
  `backend/src/shared/data/mockData.ts` (Phase 2 duplicate); companion type files
  `frontend/src/types.ts` and `backend/src/shared/data/mockData.types.ts`.
- **Diff result**: the two `mockData.ts` files differ by exactly one line — the type import path
  (`from '../types'` vs `from './mockData.types'`) — all data content is byte-identical. The two
  type files are fully byte-identical.
- **Frontend imports**: `frontend/src/App.tsx` (nine `initial*` arrays, `bedOccupancyData`,
  `departmentDistribution`), `frontend/src/components/SettingsView.tsx` and
  `frontend/src/components/Sidebar.tsx` (`roleProfiles`) — genuinely load-bearing for the frozen
  UI, cannot be removed.
- **Backend imports**: only `backend/src/shared/database/memory-store.ts`
  (`initialPatients`/`initialDoctors`, used by the in-memory MongoDB-unavailable fallback path) —
  genuinely load-bearing for that fallback to keep working.
- **Verdict**: both copies are required as currently architected; **neither can be safely removed**
  without either introducing a shared package between two now-independent apps (an architectural
  change explicitly out of scope for this phase) or removing the backend's in-memory fallback
  feature entirely (a functional change, also out of scope). No deletion performed, per
  instructions.

### Test 8 — Socket.IO: PASS (protocol-level; no GUI browser session available)

- **Connection**: Engine.IO polling handshake tested directly against the backend
  (`GET http://localhost:3000/socket.io/?EIO=4&transport=polling`) → `200`, valid handshake
  payload (`sid`, `upgrades:["websocket"]`, `pingInterval`, `pingTimeout`).
- **Proxy**: same handshake through the Vite dev-server proxy
  (`GET http://localhost:5173/socket.io/?EIO=4&transport=polling`) → `200`, equivalent valid
  handshake payload — confirms `ws: true` proxying in `frontend/vite.config.ts` is functioning.
- **Connection URL**: `frontend/src/services/socketClient.ts` calls `io(undefined, {...})` by
  default (no `VITE_SOCKET_URL` set), which resolves to the page's own origin
  (`localhost:5173`), proxied through to the backend exactly as designed.
- **Events / reconnect-disconnect**: **not tested** — exercising the `activity:new` broadcast or
  a reconnect/disconnect cycle requires a persistent WebSocket client session (a real browser tab
  or a dedicated socket.io-client script), which was not run in this environment. The handshake-
  level proof above confirms the transport path works end-to-end after separation; the
  application-level event behavior was not independently re-verified this phase.
- The pre-existing best-effort/optional Socket.IO auth middleware (`CURRENT ISSUE — DO NOT FIX IN
  THIS PHASE` per `AUTH_RBAC.md`) was not touched or re-tested for correctness beyond confirming
  it still exists unchanged (see Test 5's diff methodology, not re-run against `socket.ts` since
  that file's CORS line was intentionally changed in Phase 2 and is already documented there).

### Test 9 — UI regression: verified via static diff, not a live visual/interactive session

No headless-browser or DevTools-capable tool was available in this environment (confirmed: no
browser automation tool is registered; `WebFetch` explicitly cannot reach `localhost`). Given
that constraint, UI regression was verified the strongest way available without one: **every
frontend component file was diffed against its pre-Phase-2 (`38d420d`) content**, including
`App.tsx`, `LoginView.tsx`, `DashboardView.tsx`, `Sidebar.tsx`, `Header.tsx`, `index.css`, and
`index.html` — **all are byte-identical** (ignoring line-ending normalization). The two files that
Phase 2 intentionally touched (`apiClient.ts`, `socketClient.ts`) were diffed and contain **only**
the previously-documented minimal edits (an optional env-driven URL override each), with no other
line changed. Since no component, style, or markup file differs from the pre-separation baseline
at the source level, and the production build succeeds and serves the same bundle structure (see
Test 10), there is no code-level basis for a UI regression. **This is not equivalent to an actual
pixel/interaction walkthrough of login, dashboard, sidebar nav, forms, tables, modals, toasts,
loading/error states, or responsive behavior in a real browser** — that remains undone and should
be performed manually (or in a future phase with browser tooling available) before treating visual
parity as fully closed.

### Test 10 — Build / lint / type-check: PASS, matches Phase 2 baseline exactly

- `cd backend && npm run lint` (`tsc --noEmit`) → same 2 pre-existing errors as Phase 2's
  recorded baseline (`doctors.repository.ts:36`, `users.repository.ts:24`) — confirmed unchanged,
  Category B (pre-existing), not touched.
- `cd backend && npm run build` (esbuild) → succeeded, `dist/server.cjs` (366.4kb).
- `cd frontend && npm run lint` → clean, zero errors.
- `cd frontend && npm run build` (vite build) → succeeded, same output shape and same chunk-size
  warning as Phase 2's baseline (`index-*.js` ~1.92MB, gzip ~500KB) — no new warnings introduced.
- No test framework was introduced, per instructions.

## Issues discovered (classified)

| # | Issue | Classification |
|---|---|---|
| 1 | Stale leftover dev-server processes from a prior session occupied ports 3000/5173, causing an initial false-negative on the proxy connectivity check | Environmental artifact of this test session, not a code issue — resolved by killing the processes; re-verified clean afterward |
| 2 | Frontend's `isDemoMode()` defaults to demo-ON before the backend config fetch resolves, and the currently-documented `frontend/.env.example`'s `VITE_ENABLE_DEMO_MODE` is actually shadowed by an undocumented plain-`ENABLE_DEMO_MODE` shell variable read in `vite.config.ts`'s `define` block | C (known documented pattern, pre-existing logic) / D (the Phase-2-added `.env.example` documentation of this variable should be corrected or the precedence fixed in a future dedicated phase — see Test 6) |
| 3 | `mockData.ts` duplication between frontend and backend (drift risk) | C (already documented as a Phase 2 decision/risk) — confirmed still accurate, still not safely removable |
| 4 | Old access token remains valid after logout (no access-token blacklist) | C (known documented issue, `AUTH_RBAC.md`) — reconfirmed unchanged, not fixed |
| 5 | No read-side/object-level RBAC (any authenticated role can read any record) | C (known documented issue, `AUTH_RBAC.md`) — not re-tested for fixing, out of scope |
| 6 | Socket.IO auth middleware allows unauthenticated connections through | C (known documented issue, `AUTH_RBAC.md`) — not touched |
| 7 | Doctor/Nurse/Receptionist/Patient RBAC behavior not live-tested (no known safe credentials in this live database) | D (requires either a dedicated disposable test database/environment or explicitly-provided test credentials in a future phase) |
| 8 | No live browser/DevTools verification of UI rendering, console errors, or Socket.IO application events | D (requires browser automation tooling not available in this environment; recommend for a future phase or manual verification) |

**No Phase 2 regressions (Category A) were found.** Every check that could be performed came back
either passing or attributable to a pre-existing/already-documented condition.

## Files modified in Phase 3

Documentation only: `docs/MIGRATION_PROGRESS.md` (this record) and `docs/ENVIRONMENT.md` (one
correction note added to the `VITE_ENABLE_DEMO_MODE` row, reflecting the Test 6 finding that this
variable is currently shadowed by `vite.config.ts`'s `define` block — see Test 6 above). No
application source file was modified. `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` were reviewed
and left unchanged — Phase 3 did not find any architectural fact stated incorrectly there, and no
new decision was required. One disposable database record
(`PHASE3-VERIFICATION-TEST-DELETE-ME` in the `services` collection) was created and deleted within
the same test run, leaving no residual state.

This was Phase 3's own "next phase" pointer at the time it was written; superseded by the Phase 4 record above, which confirms Phase 4 is now complete and Phase 5 is next.

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
