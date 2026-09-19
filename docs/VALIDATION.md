# VALIDATION.md

Documents which layer validates what, as currently implemented. No validation logic was changed.

## Layers that exist

| Layer | Technology | Where |
|---|---|---|
| Backend request validation | Zod | `src/modules/*/*.validation.ts`, applied via `src/shared/middleware/validate.middleware.ts` |
| Backend schema-level validation | Mongoose schema options (`required`, `enum`, `min`/`max`, `minlength`, `unique`) | `src/modules/*/models/*.model.ts` |
| Frontend validation | HTML5 attributes + manual `useState` checks only | scattered across `src/components/*.tsx` |
| Frontend schema validation | **none** — `zod` is a dependency but is never imported anywhere under `src/components` | — |

## Backend: `validate.middleware.ts`

Generic higher-order middleware: `validate(schema)` calls `schema.parseAsync({ body: req.body, query: req.query, params: req.params })`, then reassigns the parsed/coerced result back onto `req.body`/`req.query`/`req.params`. On a `ZodError`, it calls `next(error)`, which `error-middleware.ts` formats into a `422`-style response with a structured `errors[]` array (exact status code and field-path shape `REQUIRES VERIFICATION` against `error-middleware.ts` if a future consumer needs to match it exactly).

**Confirmed applied on every module's routes** — analytics, appointments, auth, doctors, medical-records, nurses, patients, payments, receptionists, services, users all wire `validate(...)` with an appropriate schema per route (body schema for create/update, query schema for list `GET`, params schema for `:id` routes). No module was found to be missing validation middleware entirely.

## Per-module validation notes

- **Patients** (`patients.validation.ts`): uses `.passthrough()` on at least part of its schema, meaning extra/unknown fields are allowed through rather than stripped or rejected — consistent with the Mongoose model's own `strict:false` (see `DATABASE_SCHEMA.md`).
- **Payments** (`payments.validation.ts`): defines overlapping optional fields (`amount`/`totalAmount`/`paidAmount`, `serviceName`/`serviceType`/`description`) not all of which are reflected as distinct Mongoose model fields — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, flagged as schema drift between the validation layer and the persistence layer.
- **Medical records / appointments**: Zod schemas define structured sub-shapes for embedded data (prescription entries, lab results, vital signs) that are more strictly typed than the corresponding Mongoose fields, which are declared as `Mixed`/`[Object]`. In practice this means: an API request is validated against a specific shape, but once past that boundary, MongoDB will accept and store whatever shape actually gets written (including from any code path that bypasses the validated controller, e.g. a script or seeder) — real structural enforcement exists only at the Zod/API boundary, not the database.

## Frontend validation (informal, non-schema-based)

No form library (`react-hook-form`, `formik`, etc.) and no shared validation schema between client and server. Forms use plain controlled `useState` inputs with:
- HTML5 attributes: `required`, `type="email"`, `type="password"`, etc.
- A small number of manual checks, e.g. `AuthProfileView.tsx` checks `newPassword === confirmPassword` before showing a (fake, non-persisted) success message.

**Consequence** (`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`): any backend-only validation rule (e.g., password complexity, exact phone/date format, enum membership) is invisible to the user until a failed round-trip to the API returns a Zod error — there is no client-side mirroring of server rules today. Any future frontend/backend separation (Phase 2) or schema change (Phase 4) must not assume the frontend already enforces what the backend does; it plainly doesn't for anything beyond basic HTML5 constraints.

## File validation

**Not applicable** — there is no file-upload endpoint anywhere in the backend (confirmed: no `multer` dependency, no upload route in any module). What the frontend calls "file upload" (avatars, medical-record attachments) is a client-side `FileReader.readAsDataURL()` conversion to a base64 string, sent as an ordinary JSON string field through the normal create/update endpoints and validated (if at all) only as a generic string by whatever Zod schema governs that field — there is no MIME-type check, no extension check, and no file-size limit specific to this data beyond the global `express.json({limit:'10mb'})` body-size cap in `express-app.ts`.

## Business-rule validation

`REQUIRES VERIFICATION`: no explicit state-transition guards (e.g., preventing `Appointment.status` from moving `Completed → Pending`, or preventing a `Payment` from referencing a nonexistent `Appointment`/`Service`) were confirmed in the service-layer code inspected during this audit. Status/enum fields can apparently be set to any allowed enum value by any role permitted to call the corresponding `PUT` endpoint, with no cross-field or cross-entity consistency check beyond what Zod checks about the shape of the single request body. This should be treated as `NOT CONFIRMED FROM CURRENT CODE` rather than "confirmed absent" — a deeper, dedicated read of each `*.service.ts` update method would be needed to rule out any hidden guard, but none was found during this pass.

## Validation summary table

| Concern | Frontend | Backend Zod | Mongoose schema |
|---|---|---|---|
| Required fields | Partial (HTML5 `required` on some forms) | Yes, per-module | Yes, `required: [true, msg]` |
| Field types/formats | No | Yes (Zod types/coercion) | Partial (String/Number/Date/enum) |
| Enum membership | No | Yes | Yes |
| Uniqueness (email, license #, service name) | No | No (Zod can't check DB state) | Yes (`unique: true`, enforced at DB/index level, surfaced as a Mongo 11000 error → formatted by `error-middleware.ts`) |
| Cross-field / business rules | No | Minimal (shape only) | No | 
| File type/size | N/A (no upload feature) | N/A | N/A |
