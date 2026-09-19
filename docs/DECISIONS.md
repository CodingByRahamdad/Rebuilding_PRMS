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

## Change log

| Date | Decision | Recorded during |
|---|---|---|
| (baseline) | Decisions 1–8 above | Phase 1 documentation task |
