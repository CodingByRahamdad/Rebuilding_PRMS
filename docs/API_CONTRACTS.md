# API_CONTRACTS.md

All endpoints are mounted under `/api/v1` (see `ARCHITECTURE.md` §4). "Auth" = requires a valid access token via the `authenticate` middleware. "Roles" lists the values checked by `authorize(...)`; "any authenticated" means no `authorize()` call exists on that route — any logged-in role (including Patient) can call it. This is documented as observed; see `AUTH_RBAC.md` for the associated `CURRENT ISSUE`.

Response envelope (from `src/shared/utils/api-response.ts`, used by every controller): `{ success: boolean, message: string, data?: any, errors?: any[] }`. Errors are formatted centrally by `error-middleware.ts` (see `VALIDATION.md`/`AUTH_RBAC.md` for exact error-shape behavior per error type).

## System

| Method | Endpoint | Auth | Roles | Notes |
|---|---|---|---|---|
| GET | `/health` | none | public | Reports `{status, database:{connected,status,mode}, version, timestamp, uptime}`. `isHealthy` requires DB connection only when `ENABLE_DEMO_MODE==='false'`. |
| GET | `/config` | none | public | Returns `{ enableDemoMode: boolean }` only — no secrets exposed. |

## Authentication (`/auth`) — `src/modules/auth/`

| Method | Endpoint | Auth | Roles | Request body | Response | Frontend consumer |
|---|---|---|---|---|---|---|
| POST | `/auth/login` | none | public | `{email, password}` | `{user, accessToken}` (JSON) + refresh token set as httpOnly cookie | `ApiClient.login()`, `LoginView.tsx` |
| POST | `/auth/refresh-token` | none (valid refresh cookie/body) | public | none required (reads cookie) or `{refreshToken}` in body | new `{accessToken}` + rotated refresh cookie | `ApiClient` internal `refreshTokenInternal()` |
| POST | `/auth/logout` | optional (`optionalAuthenticate`) | any/none | none | clears refresh cookie, nulls stored refresh token | `ApiClient.logout()` |
| GET | `/auth/me` | required | any authenticated | — | sanitized user profile | `App.tsx` session bootstrap |
| POST | `/auth/change-password` | required | any authenticated | `{oldPassword, newPassword}` (exact field names `REQUIRES VERIFICATION` against `auth.validation.ts`) | success message | `ApiClient` method exists; **no UI form found calling it** — `AuthProfileView.tsx`'s password-change form does not call any API method (dead UI) |
| POST | `/auth/forgot-password` | none | public | `{email}` | neutral success message; **in demo mode, also returns the raw reset token** (`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, see `AUTH_RBAC.md`) | `ApiClient.forgotPassword()` |
| POST | `/auth/reset-password` | none (valid token) | public | `{token, newPassword}` (exact shape `REQUIRES VERIFICATION`) | success message | `ApiClient.resetPassword()` |

**Endpoints called by the frontend that do NOT exist on the backend** (`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, flag for Phase 2/3 regression testing):
- `POST /auth/register` — `ApiClient.register()` exists in `apiClient.ts` but no route exists in `auth.routes.ts`, and no UI calls this method either.
- `PUT /auth/profile` — called by `ApiClient` (used by `AuthProfileView.tsx`'s save-profile action, `REQUIRES VERIFICATION` on exact call site) but no matching route exists.

## Users (`/users`) — Super Admin/staff-account management

| Method | Endpoint | Auth | Roles | Notes |
|---|---|---|---|---|
| POST | `/users` | required | Super Admin | Create a User account directly (not role-profile creation — see Doctors/Nurses/etc. below for that). |
| GET | `/users` | required | any authenticated | List — no per-role filtering. |
| GET | `/users/:id` | required | any authenticated | No ownership check. |
| PUT | `/users/:id` | required | Super Admin | |
| DELETE | `/users/:id` | required | Super Admin | Soft delete (`isDeleted` flag) — `REQUIRES VERIFICATION` that repository enforces this rather than a hard delete. |

## Doctors (`/doctors`)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| POST | `/doctors` | Super Admin, Receptionist | Creates linked `User`(role Doctor) + `Doctor` profile — `REQUIRES VERIFICATION` of exact two-write transaction behavior (no transaction/session use was confirmed, meaning a partial failure could leave an orphaned User or Doctor doc). |
| GET | `/doctors`, `/doctors/:id` | any authenticated | |
| PUT | `/doctors/:id` | Super Admin, Doctor | |
| DELETE | `/doctors/:id` | Super Admin | |

## Nurses (`/nurses`) — same shape as Doctors

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/nurses` | Super Admin, Receptionist |
| GET | `/nurses`, `/nurses/:id` | any authenticated |
| PUT | `/nurses/:id` | Super Admin, Nurse |
| DELETE | `/nurses/:id` | Super Admin |

## Receptionists (`/receptionists`)

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/receptionists` | Super Admin only |
| GET | `/receptionists`, `/receptionists/:id` | any authenticated |
| PUT | `/receptionists/:id` | Super Admin, Receptionist |
| DELETE | `/receptionists/:id` | Super Admin |

## Patients (`/patients`)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| POST | `/patients` | Super Admin, Receptionist, Nurse | Creates linked `User` (role Patient, default password `PatientPass123!` if none supplied — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`) + `Patient` profile. |
| GET | `/patients`, `/patients/:id` | any authenticated | **No ownership filter — any role, including Patient, can read any patient's record.** `CURRENT ISSUE — DO NOT FIX IN THIS PHASE.` Supports query params: `page`, `limit`, `search`, `status`, `gender`, `bloodGroup` (confirmed from `ApiClient.getPatients` query-string builder; exact server-side param names `REQUIRES VERIFICATION` against `patients.validation.ts`). |
| PUT | `/patients/:id` | Super Admin, Receptionist, Nurse, Doctor | |
| DELETE | `/patients/:id` | Super Admin | |

## Appointments (`/appointments`)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| POST | `/appointments` | Super Admin, Receptionist, Doctor, Patient | No check that a Patient-role caller can only book for themselves — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`. |
| GET | `/appointments`, `/appointments/:id` | any authenticated | Query params: `search`, `status`, `department`, `date`, `type`, `patientId`, `doctorId` (from `ApiClient.getAppointments`). |
| PUT | `/appointments/:id` | Super Admin, Receptionist, Doctor | |
| DELETE | `/appointments/:id` | Super Admin, Receptionist, Doctor | |

## Medical Records (`/medical-records`)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| POST | `/medical-records` | Super Admin, Doctor, Nurse | |
| GET | `/medical-records`, `/medical-records/:id` | any authenticated | Query params: `search`, `patientId`, `doctorId`, `category`, `status`. |
| PUT | `/medical-records/:id` | Super Admin, Doctor | |
| DELETE | `/medical-records/:id` | Super Admin, Doctor | |

Note: there is no separate "Prescriptions" module/endpoint — prescriptions exist only as an embedded field inside `MedicalRecord` (see `DATABASE_SCHEMA.md`). Do not invent a `/prescriptions` endpoint in any future contract document; it does not exist.

## Payments (`/payments`)

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/payments` | Super Admin, Receptionist |
| GET | `/payments`, `/payments/:id` | any authenticated |
| PUT | `/payments/:id` | Super Admin, Receptionist |
| DELETE | `/payments/:id` | Super Admin |

## Services (`/services`) — hospital service/procedure catalog

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/services` | Super Admin only |
| GET | `/services`, `/services/:id` | any authenticated |
| PUT | `/services/:id` | Super Admin only |
| DELETE | `/services/:id` | Super Admin only |

## Analytics (`/analytics`)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/analytics/dashboard` | any authenticated | Dashboard summary stats. |
| GET | `/analytics/activity-logs` | any authenticated | Paginated. |
| POST | `/analytics/activity-logs` | Super Admin | Manual log-creation endpoint; most activity logging in practice happens server-side directly via `src/shared/utils/activity-logger.ts`, not through this route. |

## Endpoints/modules NOT present in this codebase (do not assume they exist)

- No `/notifications` module or endpoints.
- No `/reports` module (report generation for payments/receipts happens entirely client-side — see `UI_UX_RULES.md`).
- No file-upload endpoint of any kind (no `multer`, no `/upload` route in any module) — see `DATABASE_SCHEMA.md` for how attachment-like fields are still present in models with no upload path feeding them via any dedicated endpoint.
- No `/departments` module — department data is frontend-only (`localStorage`, `src/services/departmentService.ts`).

## Known inconsistencies (`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`)

- Payments' Zod validation schema exposes overlapping/duplicate optional fields (`amount`/`totalAmount`/`paidAmount`, `serviceName`/`serviceType`/`description`) suggesting drift between what the frontend actually sends and the canonical shape — `REQUIRES VERIFICATION` of exactly which fields the frontend uses today, before designing any new contract.
- Medical-record/appointment Zod schemas define structured sub-shapes (prescription, labResult, vitals) that are NOT mirrored by the Mongoose model, which stores these fields as `Mixed`/`[Object]` — real shape enforcement exists only at the Zod/API boundary today, not the database.
