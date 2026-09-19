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
