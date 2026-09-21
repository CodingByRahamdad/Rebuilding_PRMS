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
**Completed, and independently re-verified** in a follow-up Phase 4 verification pass (see `MIGRATION_PROGRESS.md`). Full proposed schema in `POSTGRESQL_SCHEMA.md` — **18 tables** (corrected from an earlier miscount of 17) — strategy write-up in `DATABASE_SCHEMA.md` ("PostgreSQL design" section), decisions recorded in `DECISIONS.md`. Summary: UUID primary keys with a `legacy_mongo_id` column per table for migration traceability (verified `UNIQUE`-safe on the 10 document-backed tables since Mongo `ObjectId`s are globally unique and no model overrides `_id`; will be `NULL` on the 8 array-normalized tables, which have no source id at all); `VARCHAR + CHECK` for enums; the previously `Mixed`-typed embedded arrays (`Patient.prescriptions/reports/billingInvoices/medicalHistory`, `MedicalRecord.prescription/labResults/attachments`) normalized into dedicated child tables; the previously `Mixed`-typed, non-FK-enforced relationships (Appointment/MedicalRecord/Payment → Patient/Doctor, and `Nurse.assignedPatientIds` → the new `nurse_patient_assignments` junction table) become real nullable foreign keys paired with a `legacy_*_ref` text column for values that don't resolve. The Payment field-drift question and the dual-modeled-prescriptions question were **resolved** during verification with direct code evidence (see `DECISIONS.md`); the `bloodGroup`/`bloodType` duplicate-field question, the `invoices`/`payments` overlap, whether `departments` should become a table, and whether `activity_logs.user_id` should be populated remain **explicitly deferred to Phase 7** (not ambiguously "open") — see `DECISIONS.md`. No PostgreSQL database, migration, or ORM code was created in either pass.

## Phase 5 — PostgreSQL Local Setup
Stand up a local PostgreSQL instance and apply the Phase 4 schema. No application code changes yet; this is infrastructure-only.

## Phase 6 — PostgreSQL Implementation
Implement a PostgreSQL-backed data-access layer (e.g., a new repository implementation) alongside — not yet replacing — the existing Mongoose repositories, so the two can be compared/tested side by side before cutover.

## Phase 7 — MongoDB → PostgreSQL Data Migration
Write and run a one-time (or repeatable, for staging) data-migration script moving existing MongoDB documents into the new PostgreSQL schema (`POSTGRESQL_SCHEMA.md`). Must have an explicit, reviewed strategy for records whose loosely-typed Mongo IDs don't cleanly resolve to a real foreign key — populate `patient_id`/`doctor_id`/`appointment_id` by matching against `legacy_mongo_id`, and where no match exists, leave the FK `NULL` and preserve the original raw value in the corresponding `legacy_*_ref` column rather than dropping or rejecting the record. **Format check required before matching (added during the Phase 4 verification pass):** `Appointment.patientId`/`doctorId` and `MedicalRecord.doctorId` are populated with synthetic, non-ObjectId-format defaults when not explicitly supplied — `Appointment.patientId` defaults to a random `PT-1000`–`PT-9999` string, `Appointment.doctorId` to a random `doc-100`–`doc-999` string, and `MedicalRecord.doctorId` to the literal `'doc-1'` — none of which are 24-hex-character `ObjectId` strings. The migration script must check the value's format before attempting a `legacy_mongo_id` lookup (a non-ObjectId-shaped value can never match and should go straight to `legacy_*_ref` without a wasted lookup), and should expect a high proportion of existing records to carry these synthetic codes rather than real references. The same format check applies to `Nurse.assignedPatientIds` entries when populating `nurse_patient_assignments` (verified demo data contains non-ObjectId placeholders like `'p-1'`, `'p-8'`). Additional concrete risks identified in Phase 4, to be resolved as part of this phase's migration script (not before): live-data audit of `Patient.strict:false` documents for undeclared fields; parsing/cleanup of inconsistently-formatted date strings before casting to `DATE`/`TIME`/`TIMESTAMPTZ`; wrapping bare-string `Patient.medicalHistory` legacy entries into `patient_visit_history` rows. The still-deferred `DECISIONS.md` questions (blood group/type canonicalization, invoices/payments overlap, whether `departments` becomes a table, whether/how to populate `activity_logs.user_id`) must be answered before this phase starts, since each changes what the migration script actually writes; the Payment field-drift and dual-modeled-prescriptions questions were resolved in the Phase 4 verification pass and do not block this phase.

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
