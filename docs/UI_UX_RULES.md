# UI_UX_RULES.md

## THE EXISTING UI/UX IS THE ABSOLUTE SOURCE OF TRUTH.

During the frontend/backend separation (Phase 2) and the PostgreSQL migration (Phases 4–8), and in every other phase of this migration unless a specific phase is explicitly approved to change it:

- **No redesign.**
- **No visual improvements.**
- **No spacing changes.**
- **No color changes.**
- **No typography changes.**
- **No layout changes.**
- **No navigation changes.**
- **No workflow changes.**
- **No responsive-behavior changes.**
- **No Tailwind class changes.**
- **No component structure changes**, including ones that look like "obvious cleanup" (e.g., merging the near-duplicate per-entity Form/Detail modal pairs, or extracting `App.tsx`'s repeated CRUD boilerplate into hooks) — these are real, documented technical-debt items (see `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`) but are explicitly **out of scope** until a dedicated, approved refactor phase exists for them.

If a technical migration step (e.g., swapping the API base URL for a separated backend, or changing how a Mongo ObjectId is represented once PostgreSQL uses integer/UUID primary keys) **requires** a frontend code change, that specific, minimal change must be identified and explicitly approved before implementation — it is not to be bundled with unrelated visual or structural improvements "while we're in there."

## Current UI inventory (as of this documentation pass — do not treat this as a target design, only as the current baseline)

### Shell / navigation
- `src/main.tsx` → `src/App.tsx` (single root component, no router).
- `Sidebar.tsx` — primary navigation; tab-based (`NavigationTab` in `src/types.ts`), not URL-based. Includes a lock icon on "restricted" items that is cosmetic only (does not block navigation — see `AUTH_RBAC.md`).
- `Header.tsx` — top bar; includes a notification bell (`unreadCount` badge — `REQUIRES VERIFICATION` whether this is currently wired to any real event source, no evidence found that it updates).

### Authentication screens
- `LoginView.tsx` — login form; ships four "Demo Credentials Quick Select" buttons that pre-fill working demo logins directly on the screen, and the email/password fields default to pre-filled admin-looking credentials. This is current, real behavior — document it, do not silently remove it as part of any migration phase without explicit approval, since it is a UI/UX behavior even though it also appears in `AUTH_RBAC.md` as a security-relevant item.
- `AuthProfileView.tsx` — profile view with tabs including a static "RBAC" display tab and a password-change form (the latter currently shows a success message without calling any API — see `AUTH_RBAC.md`).

### Dashboards / analytics
- `DashboardView.tsx` — main landing dashboard.
- `AnalyticsView.tsx` — charts via `recharts`.

### Domain list/detail screens (one pattern repeated per entity)
- `PatientsView.tsx` + `NewPatientModal.tsx` + `PatientDetailModal.tsx` — the only view with full server-side pagination wired end to end (`PAGE_SIZE=15`, page-number button strip); other list views generally fetch and render entire collections.
- `DoctorsView.tsx` + `DoctorFormModal.tsx` + `DoctorDetailModal.tsx`
- `NursesView.tsx` + `NurseFormModal.tsx` + `NurseDetailModal.tsx`
- `ReceptionistsView.tsx` + `ReceptionistFormModal.tsx` + `ReceptionistDetailModal.tsx`
- `AppointmentsView.tsx` + `NewAppointmentModal.tsx`
- `MedicalRecordsView.tsx` (list + inline record form + attachment handling)
- `PaymentsView.tsx` (list + receipt generation via `src/utils/receiptGenerator.ts`, which opens a print-formatted HTML view in a new window or falls back to a Blob download)
- `ServicesView.tsx`
- `StaffDeptsView.tsx` (departments UI — backed only by `localStorage`, not a real backend module — see `ARCHITECTURE.md`)

### Utility / overlay UI
- `SearchModal.tsx` — global Ctrl/Cmd+K search across patients/doctors/appointments.
- `ExportModal.tsx` — "Export Clinical Data" (CSV/PDF/XLSX) UI. **Current behavior: this does not actually generate or download any file** — it shows a fake "downloaded" success state after a timeout. Document as-is; this is a real (if non-functional) part of the current UI/UX.
- `MessageModal.tsx` — generic confirmation/message dialog.
- `SettingsView.tsx` — settings screen including a permissions matrix and system-settings form; current behavior does not persist changes anywhere (local state only, reset on reload).
- `PdfViewer.tsx` — custom pdf.js-based viewer for base64-encoded attachment previews.

### File "upload" interaction pattern (current, must be preserved visually even though it has no real backend)
Every avatar/attachment file input in the app (`NewPatientModal`, `DoctorFormModal`, `NurseFormModal`, `ReceptionistFormModal`, `MedicalRecordsView`, `PatientDetailModal`) uses a standard `<input type="file">` and previews/stores the result via `FileReader.readAsDataURL()` — visually this looks and behaves like a normal file picker to the user; only its backend handling differs from what the UI implies (see `VALIDATION.md`).

### Theming
- TailwindCSS 4 (`@tailwindcss/vite` plugin). `REQUIRES VERIFICATION`: exact color tokens/theme customization were not exhaustively catalogued in this pass — any future visual-parity check (Phase 10) should do a direct visual diff against the current running app rather than relying on this document alone for pixel-level detail.
- `motion` (animation library) is used for transitions — `REQUIRES VERIFICATION` of exactly which components use it; treat any component using it as UI-preservation-sensitive.

## Preservation policy for migration phases

1. **Phase 2 (frontend/backend separation)**: the only frontend changes permitted are the minimum required to point `ApiClient`'s `API_BASE_URL` at a separately-hosted backend (e.g., via an environment variable) and any strictly-required CORS/cookie adjustments needed for cross-origin requests to keep working exactly as they do today. No component, class, layout, or copy changes.
2. **Phases 4–8 (PostgreSQL migration)**: the frontend should require **zero** changes if API contracts are preserved exactly (see `API_CONTRACTS.md` and `MIGRATION_PLAN.md`). If a Mongo-specific ID format (`ObjectId` string) currently leaks into any frontend assumption (e.g., string length/format checks), that must be identified explicitly before Phase 4 schema design finalizes PostgreSQL primary key types.
3. **Phase 10 (UI/UX regression)**: this phase exists specifically to verify pixel/behavior parity against this baseline document and the live pre-migration app. Any discrepancy found there is a bug to fix, not a decision to make freshly.
4. **Any other phase**: if you believe a UI/UX change is unavoidable, stop and get explicit approval before writing any frontend code. Do not infer approval from this document or from adjacent code comments.
