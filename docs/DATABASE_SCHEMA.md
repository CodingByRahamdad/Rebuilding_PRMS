# DATABASE_SCHEMA.md

Current database: MongoDB, accessed via Mongoose (`src/modules/*/models/*.model.ts`). This is the schema being replaced by PostgreSQL in a future phase — this document is the baseline for that schema-design work. Nothing here has been changed.

Cross-model conventions confirmed on every model: `{ timestamps: true }` (adds `createdAt`/`updatedAt`), a `toJSON.transform` that remaps `_id → id`, strips `__v`, and strips any `select:false` secret fields, and an `isDeleted: Boolean` (default `false`, indexed) soft-delete flag. **No model has `createdBy`/`updatedBy`/`deletedAt` audit fields** — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` (there is no schema-level audit trail of who created/changed/deleted a record; only the separate `ActivityLog` collection covers this, populated manually from service code, not via hooks). No model was found to define pre/post save hooks.

## User — `src/modules/users/models/user.model.ts`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| name | String | yes | — | trim, min 2 |
| email | String | yes | — | unique, lowercase, trim, indexed |
| passwordHash | String | yes | — | `select:false` |
| role | String enum `Super Admin\|Doctor\|Nurse\|Receptionist\|Patient` | yes | — | indexed |
| avatar | String | no | `''` | |
| status | String enum `Active\|On Leave\|Inactive` | no | `Active` | indexed |
| phone | String | yes | — | trim |
| refreshToken | String | no | — | `select:false` |
| passwordResetTokenHash | String\|null | no | — | `select:false` |
| passwordResetExpires | Date\|null | no | — | `select:false` |
| isDeleted | Boolean | no | `false` | indexed |

Indexes: `{email:1,isDeleted:1}`, `{role:1,isDeleted:1}` (compound, in addition to per-field indexes above).

## Patient — `src/modules/patients/models/patient.model.ts`

Schema option: **`strict:false`** (allows arbitrary extra fields to be saved beyond what's declared — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`, this weakens type safety at the DB layer and will need explicit resolution before a PostgreSQL column-based schema can be designed).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| userId | ObjectId ref `User` | no | — | optional — patients may have no login account |
| patientCode | String | no | — | indexed |
| name | String | yes | — | indexed |
| email, phone | String | yes | — | |
| age | Number | no | `35` | |
| dateOfBirth | String | no | `''` | stored as string, not Date |
| gender | enum | no | `Male` | |
| bloodGroup, bloodType | String | no | `'O+'` | two near-duplicate fields |
| address | String | no | `'Hospital Ward'` | |
| department | String | no | `'General Medicine'` | |
| doctor | String (plain, not a ref) | no | `'Dr. Alex Morgan'` | denormalized, no FK |
| room | String | no | `'Room 101'` | |
| condition | String | no | `'Stable'` | |
| admissionDate | String | no | today's ISO date (function default) | |
| emergencyContact | embedded `{name,relationship,phone}` | no | default object | `_id:false` |
| medicalHistory | Mixed | no | `[]` | |
| allergies | [String] | no | `[]` | |
| insuranceProvider, insurancePolicyNumber | String | no | `''` | |
| prescriptions, reports, billingInvoices | Mixed | no | `[]` | |
| vitals | Mixed | no | default object with BP/HR/temp/O2 | |
| status | String | no | `'Admitted'` | indexed |
| isDeleted | Boolean | no | `false` | indexed |

Text index: `{name, email, phone: 'text'}` for search.

## Doctor — `src/modules/doctors/models/doctor.model.ts`

| Field | Notes |
|---|---|
| userId | ObjectId ref `User`, **required, unique** (one profile per account), indexed |
| name, email, phone | required |
| age | min 18 / max 120 |
| specialization, department | required, indexed |
| licenseNumber | required, **unique** |
| experience | String, required |
| consultationFee | Number, required, min 0 |
| availability | default `'Mon-Fri, 09:00 AM - 05:00 PM'` |
| rating | default 4.8 (min0/max5) |
| totalPatients | default 0 |
| status | enum, default `Active`, indexed |
| isDeleted | default `false`, indexed |

Compound indexes: `{department:1,status:1}`, `{specialization:1}`.

## Nurse — `src/modules/nurses/models/nurse.model.ts`

| Field | Notes |
|---|---|
| userId | ObjectId ref `User`, required, unique, indexed |
| department | required, indexed |
| shift | enum `Morning\|Evening\|Night`, required |
| licenseNumber | required, **unique** |
| assignedWard | required |
| patientLoad | default 0 |
| assignedPatientIds | `[String]`, default `[]` — **plain strings, not ObjectId refs** |
| status | enum, default `Active`, indexed |
| isDeleted | default `false`, indexed |

Compound index: `{department:1,shift:1}`.

## Receptionist — `src/modules/receptionists/models/receptionist.model.ts`

| Field | Notes |
|---|---|
| userId | ObjectId ref `User`, required, unique, indexed |
| department | required, indexed |
| shift | enum, required |
| deskNumber | required |
| status | enum, default `Active`, indexed |
| isDeleted | default `false`, indexed |

No additional compound indexes.

## Appointment — `src/modules/appointments/models/appointment.model.ts`

| Field | Type | Notes |
|---|---|---|
| patientId | **`Schema.Types.Mixed`** | not a strict ObjectId ref; default is a random string like `PT-####`; indexed |
| doctorId | **`Schema.Types.Mixed`** | default random `doc-###`; indexed |
| patientName, doctorName | required String | denormalized, no FK |
| department | required, indexed |
| date, time | required String | **not Mongoose `Date` type**; `date` indexed |
| type | enum (7 values), default `Consultation` |
| status | enum `Pending\|Confirmed\|Completed\|Cancelled`, default `Pending`, indexed |
| symptoms, notes | String, default `''` |
| isDeleted | default `false`, indexed |

Compound indexes: `{date:1,doctorId:1,status:1}`, `{patientId:1,date:-1}`.

`CURRENT ISSUE — DO NOT FIX IN THIS PHASE`: `patientId`/`doctorId` are loosely-typed `Mixed` fields with random-string defaults — the relationship to Patient/Doctor is by naming convention only, not enforced referential integrity at the DB layer. This is directly relevant to PostgreSQL schema design (Phase 4): a real foreign key relationship will need to be introduced, and the migration script (Phase 7) will need a strategy for records whose `patientId`/`doctorId` don't cleanly resolve to a real Patient/Doctor document.

## MedicalRecord — `src/modules/medical-records/models/medical-record.model.ts`

| Field | Type | Notes |
|---|---|---|
| patientId | Mixed | required, indexed, no ref |
| patientName | required |
| patientCode | default `''` |
| doctorId | Mixed | optional, default `'doc-1'` (hardcoded fallback), indexed |
| doctorName | default `'Dr. Sarah Jenkins'` (hardcoded demo name baked into schema default — `CURRENT ISSUE — DO NOT FIX IN THIS PHASE`) |
| recordCode | default `''` |
| reportType | default `'Diagnostic Report'` |
| category | default `'General'` |
| date | required, indexed |
| diagnosis | required |
| treatment | default `''` |
| symptoms | `[String]`, default `[]` |
| prescription | **Mixed**, default `[]` — a `prescriptionSchema` sub-shape is defined in the file but the field itself is typed `Mixed`, so the sub-schema is not actually enforced |
| labResults | **`[Object]`**, default `[]` — same situation, a `labResultSchema` is defined but unused for validation |
| vitalSigns | embedded subdoc (`_id:false`), default all-empty-string object |
| status | default `'Active'` |
| attachments | `[Object]`, default `[]` — no upload endpoint feeds this (see `API_CONTRACTS.md`) |
| notes | default `''` |
| isDeleted | default `false`, indexed |

Index: `{patientId:1,date:-1}`.

## Payment — `src/modules/payments/models/payment.model.ts`

| Field | Type | Notes |
|---|---|---|
| patientId | Mixed | required, indexed, no ref |
| patientName | required |
| appointmentId | Mixed | optional, no ref enforcement to Appointment |
| serviceName | required String | denormalized, no ref to Service model |
| amount | Number | required, min 0 |
| status | enum `Paid\|Pending\|Partial\|Overdue\|Refunded`, default `Pending`, indexed |
| date, dueDate | required String |
| paymentMethod | String (typed as a union in TS but stored as a free string in Mongo) |
| transactionId, partialReason, nextPaymentDate | default `''` |
| isDeleted | default `false`, indexed |

Index: `{status:1,date:-1}`.

## Service — `src/modules/services/models/service.model.ts`

| Field | Notes |
|---|---|
| name | required, **unique**, indexed |
| category, department | required, indexed |
| cost | required, min 0 |
| description | required |
| durationMinutes | required, min 1 |
| isAvailable | default `true`, indexed |
| isDeleted | default `false`, indexed |

No refs in or out.

## ActivityLog — `src/modules/analytics/models/activity-log.model.ts`

| Field | Notes |
|---|---|
| user | required String, indexed — **free text (name/email), not an ObjectId ref to User** |
| action | required, indexed |
| details | required |
| time | required String — redundant with the `createdAt` timestamp |
| ipAddress | default `''` |
| isDeleted | default `false`, indexed |

Index: `{createdAt:-1}`.

## Relationship map (only relationships actually supported by code)

```
User ──1:1 (optional)────────── Patient        (Patient.userId → User, optional)
User ──1:1 (required, unique)── Doctor         (Doctor.userId → User)
User ──1:1 (required, unique)── Nurse          (Nurse.userId → User)
User ──1:1 (required, unique)── Receptionist   (Receptionist.userId → User)

Appointment ···(Mixed ID, name string, NOT a real ref)···> Patient
Appointment ···(Mixed ID, name string, NOT a real ref)···> Doctor

MedicalRecord ···(Mixed ID, name string, NOT a real ref)···> Patient
MedicalRecord ···(Mixed ID, name string, NOT a real ref)···> Doctor

Payment ···(Mixed ID, name string, NOT a real ref)···> Patient
Payment ···(Mixed ID, NOT a real ref)···> Appointment
Payment ···(free string name, NOT a real ref)···> Service

ActivityLog ···(free string, NOT a real ref)···> User
```

Only the four `User ↔ {Patient,Doctor,Nurse,Receptionist}` relationships are real, enforced Mongoose `ref`s. Every other cross-entity relationship (Appointment/MedicalRecord/Payment → Patient/Doctor/Service, ActivityLog → User) is a loosely-typed ID or free-text name string with **no database-level referential integrity**. `CURRENT ISSUE — DO NOT FIX IN THIS PHASE` — but this is the single most important fact for Phase 4 (PostgreSQL schema design) to account for: introducing real foreign keys here is a schema change, not just a storage-engine change, and the Phase 7 data-migration script will need explicit handling for any existing records whose loosely-typed ID doesn't resolve cleanly.

## Data-integrity concerns to carry into migration planning

- `Patient.strict:false` means unknown/undeclared fields could exist in real documents today that aren't visible in the schema definition — `REQUIRES VERIFICATION` via a live data audit (sampling actual documents) before finalizing a PostgreSQL column list for `patients`.
- Several fields duplicate the same concept with different names (`Patient.bloodGroup` vs `bloodType`; `Payment` schema's `amount` vs the Zod validation layer's additional `totalAmount`/`paidAmount` — see `API_CONTRACTS.md`) — needs an explicit decision (not made in this phase) about which name is canonical going forward.
- Several date-like fields are stored as free-form `String`, not Mongoose `Date` (`Patient.dateOfBirth`, `Appointment.date`/`time`, `Payment.date`/`dueDate`) — this affects both query semantics today and the PostgreSQL column-type decision in Phase 4.

---

# PostgreSQL design (Phase 4)

The Mongo baseline above is unchanged; everything from here down is the **proposed** relational design produced by Phase 4, re-verified in a follow-up Phase 4 verification pass (see `MIGRATION_PROGRESS.md`). No database has been created and no code depends on this yet. The full table-by-table column reference and ER overview live in `POSTGRESQL_SCHEMA.md` — **18 tables** (a "17" figure in the original Phase 4 final report was a miscount, corrected during verification). This section records the cross-cutting strategy decisions that reference applies.

## ID strategy: UUID primary keys

Every table gets `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, plus a nullable `legacy_mongo_id TEXT` column carrying the original Mongo `ObjectId` (hex string) for migration traceability — `UNIQUE` on the 10 tables with a 1:1 Mongo source document (`users, patients, doctors, nurses, receptionists, appointments, medical_records, payments, services, activity_logs`), verified globally unique since MongoDB `ObjectId`s are unique by construction and no model overrides `_id`. On the 8 normalized/junction tables sourced from array items rather than documents, `legacy_mongo_id` will be `NULL` for every migrated row, not merely non-unique — individual `Mixed`-array entries have no discrete id in MongoDB at all (see `POSTGRESQL_SCHEMA.md`).

**Why UUID over bigint/serial:** the frontend and API already treat `id` as an opaque string (`toJSON.transform` remaps `_id → id` as a string everywhere; `API_CONTRACTS.md` never documents numeric IDs). UUIDs keep that contract true with zero frontend/API shape change, whereas sequential integers would be a visible format change even if stringified. The tradeoff (larger index size vs. bigint) was accepted since this is an admin/hospital-management workload, not a high-QPS system where that difference is likely to matter. Confirmed with the project owner before finalizing this design.

## Date/time strategy

Mongo stores several logically-date fields as plain `String` (`Patient.dateOfBirth`/`admissionDate`, `Appointment.date`/`time`, `MedicalRecord.date`, `Payment.date`/`dueDate`/`nextPaymentDate`, lab result `date`). The proposed schema types these properly:
- Calendar-only fields (no time-of-day meaning): `DATE` — e.g. `date_of_birth`, `admission_date`, `record_date`, `payment_date`, `due_date`.
- `Appointment.time` (free text like `"10:00 AM"`): `TIME`.
- All `createdAt`/`updatedAt`: `TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Migration risk:** existing string values may not all be in a single consistent, parseable format (no format was enforced at the Mongo/Zod layer). `REQUIRES VERIFICATION` via a live-data audit before Phase 7 attempts to cast these columns; malformed values will need per-record cleanup or a fallback `NULL`, decided at that time.

## Enum/status strategy: VARCHAR + CHECK, not native ENUM or lookup tables

Every enum-like field (`role`, `status` variants, `gender`, `shift`, `type`, appointment/payment `status`) becomes `VARCHAR(N) NOT NULL ... CHECK (col IN (...))`. Native Postgres `ENUM` types were rejected because altering them (`ALTER TYPE ... ADD VALUE`) is more disruptive than adding a `CHECK` clause, and the current app already treats these values as plain strings defined in application code (Zod schemas), not as a separately-managed type — `VARCHAR + CHECK` is the closest relational equivalent to that existing practice. A lookup/reference table was rejected as unnecessary complexity: none of these value sets have their own attributes (no "role has a description" concept anywhere in the app) and all are small, static, code-defined sets.

One deliberate exception: `patients.status` and `medical_records.status` are **not** given a `CHECK` constraint, because the current Mongoose fields for both are unconstrained free strings — adding a `CHECK` now would reject data the app can currently produce. Documented as a compatibility-impact call, not applied.

## Normalizing the embedded/Mixed arrays

`Patient.prescriptions/reports/billingInvoices/medicalHistory` and `MedicalRecord.prescription/labResults/attachments` are all `Schema.Types.Mixed` or `[Object]` arrays today — no DB-level shape enforcement, no independent identity for each item beyond its position in the array. Per the task's requirement to determine "the correct relational model," this design normalizes each into its own child table with a foreign key back to its parent (`prescriptions`, `lab_results`, `medical_record_attachments`, `patient_reports` + `patient_report_attachments`, `invoices`, `patient_visit_history`) rather than porting them as opaque `JSONB` columns. This was a decision explicitly confirmed with the project owner (JSONB was the alternative, offering a closer 1:1 structural mirror at the cost of remaining unqueryable/unconstrained at the DB layer — rejected in favor of real relational structure). `Patient.vitals` (a single fixed-shape object, not a list) is flattened into typed columns directly on `patients` instead of getting its own table, since it isn't a repeating structure. See `POSTGRESQL_SCHEMA.md` for full column lists and the open questions this normalization surfaces (the `prescriptions` dual-source ambiguity, the `invoices`/`payments` overlap).

## Relationships / foreign keys

The only relationships enforced as real Mongoose `ref`s today are `User ↔ {Patient,Doctor,Nurse,Receptionist}` (1:1) — these become required (except Patient's, which stays optional and non-unique, matching `patient.model.ts`'s `userId: {ref:'User', required:false}` exactly) `UNIQUE` foreign keys in Postgres for Doctor/Nurse/Receptionist, unchanged in spirit.

**`ON DELETE CASCADE` clarification (added during the Phase 4 verification pass):** the `doctors/nurses/receptionists.user_id → users.id` foreign keys are declared `ON DELETE CASCADE`. This is a **Postgres-side design choice, not a port of existing Mongo behavior** — MongoDB has no FK/cascade concept at all, and the current application only ever soft-deletes (`isDeleted` flag; confirmed no hard-delete-then-cascade code path exists anywhere in the module layer). In practice this FK behavior is not exercised by any current app operation; it only matters if a future phase introduces real hard deletes.

Every other cross-entity relationship today (`Appointment`/`MedicalRecord`/`Payment` → `Patient`/`Doctor`, `Payment` → `Appointment`) is a loosely-typed `Schema.Types.Mixed` field with no referential integrity, sometimes holding synthetic non-ObjectId placeholder strings (`PT-####`, `doc-###`, or MedicalRecord's literal `'doc-1'` default). The proposed schema introduces real, **nullable** foreign keys for these (`ON DELETE SET NULL`), paired with a `legacy_*_ref TEXT` column that preserves the original raw value whenever it doesn't resolve to a real row. This is the single biggest structural change in this design and the biggest Phase 7 migration risk — see `MIGRATION_PLAN.md`. Verified precisely: `Appointment.patientId` defaults to `` `PT-${Math.floor(1000 + Math.random() * 9000)}` `` (4-digit random, not derived from any real id) and `doctorId` to `` `doc-${Math.floor(100 + Math.random() * 900)}` `` (3-digit random); neither is unique-constrained in Mongo, so collisions across records are possible and neither format resembles a 24-hex-character `ObjectId` — the Phase 7 matching logic will need an explicit format check before attempting a `legacy_mongo_id` lookup (see `MIGRATION_PLAN.md`).

Relationships that exist only as a denormalized display string today (`Patient.doctor`, `Payment.serviceName`, `ActivityLog.user`) are **kept as text columns, not turned into enforced FKs** — the current application never establishes those as real relationships (no `doctorId` on Patient, no `serviceId` on Payment, no `userId` on ActivityLog), and inventing one would go beyond what "the correct relational model" for *this* app supports. `ActivityLog` does get one exception: an optional, nullable `user_id` column is added, but **populating it is explicitly deferred to a future implementation phase**, not merely "best-effort" — verified against `activity-logger.ts` that the calling code has `actor.id` available at write time but currently discards it into a formatted display string; no reverse lookup exists anywhere. See `DECISIONS.md`.

`Nurse.assignedPatientIds` (an array of plain strings) is the one array field that *does* represent a real existing many-to-many relationship, so it becomes a proper `nurse_patient_assignments` junction table rather than a denormalized column. Verified against `nurses.repository.ts`'s demo/fallback data that this array genuinely contains non-ObjectId placeholder strings (e.g. `'p-1'`, `'p-8'`) in practice, not just hypothetically — so, like the Appointment/MedicalRecord/Payment FKs above, the junction table's `patient_id` side is nullable with a `legacy_patient_ref` fallback column (corrected during the Phase 4 verification pass; the original draft had both sides `NOT NULL`, which would have silently dropped unresolvable assignments).

**API-contract preservation (verified):** `patients.repository.ts`/`medical-records.repository.ts` currently perform a single `findOne`/`findById` with no `.populate()` or secondary queries — every embedded array (`Patient.prescriptions/reports/billingInvoices/medicalHistory`, `MedicalRecord.prescription/labResults/attachments`) is returned nested inside one document read today, and the frontend (`apiClient.ts`, `types.ts`) expects exactly that nested shape from a single API call, with no separate child-resource endpoints anywhere. Normalizing these into separate Postgres tables **does not break the JSON response contract** — the same nested shape can be reconstructed — but it **does require new aggregation/re-nesting logic** in a future backend implementation phase (Phase 6) that has no equivalent today, since the current code performs zero assembly (it's a direct embedded-document read). This is real, additional implementation work to budget for in Phase 6, not a risk to the schema design itself.

## Auth/security data

`users` carries `password_hash`, `refresh_token` (single active token, ported as-is), `password_reset_token_hash`, `password_reset_expires_at` — a direct, unchanged port of the current single-session-per-user model. No separate sessions/tokens table was introduced, since the app has no multi-device/multi-session support to preserve. No authentication behavior changes as part of this design (per task instructions).

## Demo-mode interaction

`ENABLE_DEMO_MODE` currently selects the Mongo *database name* (`prms_production` vs `prms_demo`, see `DEMO_MODE.md`) and gates which seed rows `seeder.ts` inserts — it has no schema-level footprint (no demo-only collections or fields). This proposed Postgres schema has no demo-specific tables or columns either, and no table requires a demo-only row to exist for the app to function; the same env-var-driven database/schema-selection approach can carry over unchanged in a later phase. Not decided in this phase: whether that should be a separate Postgres database or a separate schema within one database (see `DECISIONS.md`).

## Index strategy

Every compound index from the Mongoose baseline has a direct Postgres B-tree equivalent (see `POSTGRESQL_SCHEMA.md` for the full per-table list): `(email, is_deleted)`/`(role, is_deleted)` on `users`; `(department, status)`/`(specialization)` on `doctors`; `(department, shift)` on `nurses` (a real compound `schema.index()` call in `nurse.model.ts`); `(appointment_date, doctor_id, status)`/`(patient_id, appointment_date DESC)` on `appointments`; `(patient_id, record_date DESC)` on `medical_records`; `(status, payment_date DESC)` on `payments`; `(created_at DESC)` on `activity_logs`. **Corrected during the Phase 4 verification pass:** `receptionists` does **not** have a compound `(department, shift)` index in Mongo — `receptionist.model.ts` has zero `schema.index()` calls, only separate field-level indexes on `department` and `shift`; the Postgres design now reflects two single-column indexes there instead. `services` also has no compound index, only field-level ones on `category`, `department`, `is_available` (an explicit Indexes line was missing for `services` in the original draft and has been added). Unique indexes (`users.email`, `doctors.license_number`, `nurses.license_number`, `services.name`, `legacy_mongo_id` ×10) become Postgres `UNIQUE` constraints — currently these are enforced only via Mongo's `unique:true` index (surfaced to the app as an `E11000` error); Postgres surfaces the equivalent as a `23505 unique_violation`, which the service/repository layer will need to handle when that layer is eventually built (Phase 6, not this phase). Mongo's `text` index on `patients(name,email,phone)` becomes a Postgres GIN full-text index over the same three columns.
