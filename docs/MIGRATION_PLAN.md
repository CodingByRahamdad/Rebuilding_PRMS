# MIGRATION_PLAN.md

High-level roadmap only. **No phase beyond Phase 1 has been executed.** Each phase requires explicit review/approval before the next one begins (see `DECISIONS.md` #8).

## Phase 0 — Git baseline
Already completed by the project owner prior to this documentation pass (confirmed: `git status` shows a clean working tree on branch `main`, up to date with `origin/main`).

## Phase 1 — Project Documentation & Migration Baseline
**This phase.** Inspect and document the current application (architecture, frontend, backend, database, API contracts, auth/RBAC, validation, environment, demo mode, UI/UX baseline) without modifying any application code. See `MIGRATION_PROGRESS.md` for status.

## Phase 2 — Frontend/Backend Separation
Split the current single Express process (which both serves the API and hosts/proxies the Vite SPA — see `ARCHITECTURE.md` §1) into two independently deployable applications: a standalone API server and a standalone frontend build/serve pipeline. Must preserve API contracts (`API_CONTRACTS.md`) and UI/UX (`UI_UX_RULES.md`) exactly. Expected touch points (not yet done): `ApiClient`'s hardcoded relative `API_BASE_URL`, CORS origin configuration, cookie `sameSite`/domain behavior for the refresh token once frontend and backend are on different origins, and removal of the Vite-middleware-mode branch from `server.ts`.

## Phase 3 — Separation Verification
Confirm the separated frontend and backend function identically to the pre-separation baseline: every endpoint in `API_CONTRACTS.md` still behaves the same, every UI flow in `UI_UX_RULES.md` still renders/behaves the same, auth/refresh/logout still work across the new origin boundary.

## Phase 4 — PostgreSQL Schema Design
Design relational schema equivalents for every Mongoose model documented in `DATABASE_SCHEMA.md`. Must explicitly resolve, as design decisions (not silently): the `Mixed`-typed, non-FK-enforced relationships (Appointment/MedicalRecord/Payment → Patient/Doctor/Service), the `Patient.strict:false` passthrough fields, duplicate-concept fields (e.g. `bloodGroup`/`bloodType`), and date-like fields currently stored as free-form strings.

## Phase 5 — PostgreSQL Local Setup
Stand up a local PostgreSQL instance and apply the Phase 4 schema. No application code changes yet; this is infrastructure-only.

## Phase 6 — PostgreSQL Implementation
Implement a PostgreSQL-backed data-access layer (e.g., a new repository implementation) alongside — not yet replacing — the existing Mongoose repositories, so the two can be compared/tested side by side before cutover.

## Phase 7 — MongoDB → PostgreSQL Data Migration
Write and run a one-time (or repeatable, for staging) data-migration script moving existing MongoDB documents into the new PostgreSQL schema. Must have an explicit, reviewed strategy for records whose loosely-typed Mongo IDs (see `DATABASE_SCHEMA.md`) don't cleanly resolve to a real foreign key.

## Phase 8 — Switch Application to PostgreSQL
Cut the running application over from the Mongoose data-access layer to the PostgreSQL one. MongoDB remains available as a fallback/rollback path (see Phase 13 — it is not removed here).

## Phase 9 — API/RBAC/Functional Regression
Full regression pass against `API_CONTRACTS.md` and `AUTH_RBAC.md`: every endpoint, every role's access, every validation rule, confirmed to behave identically post-cutover.

## Phase 10 — UI/UX Regression
Full regression pass against `UI_UX_RULES.md`: every page, dashboard, and interaction pattern confirmed pixel/behavior-identical to the pre-migration baseline.

## Phase 11 — Security Hardening
The first phase where the `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` items documented throughout `docs/` (missing object-level authorization on reads, hardcoded default secrets, unconditional default admin password, demo-mode reset-token disclosure, permissive CORS, optional Socket.IO auth, etc.) are actually addressed, each as its own explicitly-approved change.

## Phase 12 — Production/Docker Configuration
Fix deployment configuration issues documented in `ENVIRONMENT.md`/`ARCHITECTURE.md`: the missing `Dockerfile`, secrets hardcoded in `docker-compose.yml`, unauthenticated Mongo container (moot after Phase 13, but relevant if any transitional dual-database period runs in Docker), and production CORS/rate-limit configuration.

## Phase 13 — MongoDB Removal
Only after PostgreSQL has been fully verified in production (Phases 8–12 complete and stable), remove the Mongoose dependency, models, and MongoDB connection code entirely.

---

**Reminder**: this file describes the plan. Executing any phase beyond Phase 1 requires a separate, explicit request and review — do not begin Phase 2 as a continuation of this documentation task.
