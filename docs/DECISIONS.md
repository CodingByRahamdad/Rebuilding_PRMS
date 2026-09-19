# DECISIONS.md

Currently approved architectural decisions for this migration. Recorded as of Phase 1. Any future session should check this file before proposing an alternative approach to one of these points.

1. PostgreSQL will replace MongoDB.
2. Frontend and backend will be separated into independently deployable applications.
3. Existing UI/UX must remain unchanged during migration (see `UI_UX_RULES.md` for the full preservation policy).
4. Frontend must remain database-agnostic (it should only ever talk to the backend's API, never assume MongoDB- or PostgreSQL-specific data shapes beyond what the API contract documents).
5. Existing API contracts should be preserved wherever practical (see `API_CONTRACTS.md` for the current baseline that any future contract change must be diffed against).
6. Migration will happen in controlled, explicitly-approved phases (see `MIGRATION_PLAN.md`).
7. MongoDB will not be removed until PostgreSQL is fully verified (Phase 13 is the last phase, gated on Phases 8–12 completing successfully).
8. Every phase requires a review before the next phase begins — no phase should be started as an unreviewed continuation of a previous one, including this documentation phase.

## Decisions explicitly NOT yet made (do not assume an answer)

These require the project owner's input before any later phase can proceed on them — see the open questions also raised in the prior codebase audit:

- Whether the currently-configured MongoDB Atlas connection string in `.env` represents a live credential requiring immediate rotation, or an already-retired one. `REQUIRES VERIFICATION` — treat as sensitive regardless.
- Whether `ENABLE_DEMO_MODE` is intended to ever be `true` in any real/production deployment, or is strictly a local/dev convenience — this affects the severity and urgency of several items flagged `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` throughout `docs/`.
- Whether the missing read-side/object-level authorization (documented in `AUTH_RBAC.md`) is acceptable for the application's actual deployment model (e.g., trusted-staff-only internal tool) or must be treated as a launch-blocking issue — this will determine where Phase 11 (Security Hardening) sits in priority relative to the database/separation work.
- Whether the several non-functional/mock frontend features (`ExportModal`, `AuthProfileView` password-change, `SettingsView` persistence, `StaffDeptsView`/departments-as-localStorage) are placeholders awaiting real backend endpoints in a future phase, or are intentionally out of scope for this migration entirely.
- Whether the frontend's monolithic `App.tsx` structure (no router, no context, heavy prop-drilling) is acceptable to carry through the migration unchanged, or whether a dedicated frontend-architecture refactor phase should be added to the roadmap (it is not currently in `MIGRATION_PLAN.md`).

## Phase 2 decisions

9. Backend and frontend each mirror their existing internal folder shape 1:1 under `backend/src/...` and `frontend/src/...` respectively, rather than reorganizing during the move — this keeps the relocation a pure move (verified via `git mv`, preserving history) with no internal import-path rewrites needed beyond the new roots.
10. Local-dev cross-origin requests are handled via a Vite `server.proxy` (forwarding `/api` and `/socket.io` to the backend) rather than making `apiClient.ts`/`socketClient.ts` always require an absolute backend URL. This keeps both files' request-building logic behaviorally unchanged in dev (still same-origin from the browser's perspective) and avoids needing to get cross-origin credentialed-cookie CORS exactly right for local development. Absolute URLs (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`) are an opt-in production-only fallback.
11. **npm** was chosen over bun as the package manager for both new apps — the root repo had both `bun.lock` and `package-lock.json` with no other signal disambiguating which was authoritative; npm is the safer, more universally-available common denominator for CI/deploy environments.
12. `@google/genai` was removed from both new `package.json` files — confirmed unused by any code (paired with the also-unused `GEMINI_API_KEY` env var). A dependency removal is a state change worth recording even though it has zero runtime effect.
13. `backend/src/shared/data/mockData.ts` (and the types it needs) was duplicated from `frontend/src/data/mockData.ts` rather than extracted into a shared package — the backend's in-memory Mongo fallback store (`memory-store.ts`) depends on this data, and introducing a shared/workspace package was judged out of scope for a phase whose objective is architectural *separation*, not new shared tooling. The duplication is documented as a known drift risk in `MIGRATION_PROGRESS.md`.
14. A full Docker rework (two services, two Dockerfiles, container CORS/proxy wiring) was explicitly deferred to a future phase rather than attempted now — `docker-compose.yml` was already non-functional before Phase 2 (references a missing `Dockerfile`), so leaving it as-is does not regress anything, and a correct rework is a nontrivial redesign outside this phase's "smallest safe change" mandate.

## Change log

| Date | Decision | Recorded during |
|---|---|---|
| (baseline) | Decisions 1–8 above | Phase 1 documentation task |
| 2026-09-19 | Decisions 9–14 above | Phase 2 frontend/backend separation |
