# POSTGRESQL_SCHEMA.md

Proposed PostgreSQL schema for Meridian PRMS — **design only**. No database has been created, no migration has been run, no application code depends on this yet. This is the Phase 4 deliverable referenced by `MIGRATION_PROGRESS.md` and `DECISIONS.md`. The Mongoose baseline this design is derived from lives in `DATABASE_SCHEMA.md`; read that first for what each field means in the current app.

**Verified table count: 18.** (A Phase 4 final-report typo previously said 17; corrected during the Phase 4 verification pass — see `MIGRATION_PROGRESS.md`.) Full list, in the order documented below:

1. `users`
2. `patients`
3. `doctors`
4. `nurses`
5. `nurse_patient_assignments` (junction)
6. `receptionists`
7. `appointments`
8. `medical_records`
9. `prescriptions` (normalized, shared)
10. `lab_results` (normalized)
11. `medical_record_attachments` (normalized)
12. `patient_reports` (normalized)
13. `patient_report_attachments` (normalized)
14. `invoices` (normalized)
15. `patient_visit_history` (normalized)
16. `payments`
17. `services`
18. `activity_logs`

Cross-cutting rules applied to every table (see `DATABASE_SCHEMA.md` §"PostgreSQL design strategy" for the full rationale):

- **PK**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Legacy mapping**: `legacy_mongo_id TEXT` on every table that has a direct 1:1 Mongo source *document*, holding that document's original `ObjectId` (as hex string) for migration traceability and rollback lookups — `UNIQUE`, since MongoDB `ObjectId`s are globally unique by construction and no model in this app overrides `_id` (verified directly against all 10 model files during the Phase 4 verification pass). This applies to tables 1–4, 6–8, 16–18 above. The 8 normalized/junction tables (5, 9–15) were sourced from `Schema.Types.Mixed`/array-of-object fields or plain string arrays — **individual array items have no discrete id in MongoDB at all** (they are not sub-documents with their own `_id`, just plain array entries). `legacy_mongo_id` is still declared on these tables for forward-compatibility, but it will be `NULL` for every row produced by the Phase 7 migration, not merely "non-unique" — there is no source value to populate it with.
- **Soft delete**: `is_deleted BOOLEAN NOT NULL DEFAULT false` preserved on every table that had it in Mongoose (top-level collections only — the new normalized child tables introduced by this design did not exist as independent Mongo documents, so they have no independent soft-delete flag; deleting the parent cascades via `ON DELETE CASCADE`).
- **Timestamps**: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` wherever Mongoose had `{timestamps:true}` (all former top-level collections). Pure child/junction tables introduced by normalization get `created_at` only, matching that they represent point-in-time facts, not independently editable records today.
- **Enums**: `VARCHAR` + `CHECK (col IN (...))`, not native Postgres `ENUM` — see `DECISIONS.md`.

## Entity-relationship overview

```
users ──1:1(optional)──> patients
users ──1:1(required,unique)──> doctors
users ──1:1(required,unique)──> nurses
users ──1:1(required,unique)──> receptionists
users ──0:1(new column, population deferred)──> activity_logs (user_id, nullable)

patients ──1:many──> prescriptions (patient_id, nullable side)
patients ──1:many──> patient_reports ──1:many──> patient_report_attachments
patients ──1:many──> invoices
patients ──1:many──> patient_visit_history
patients <──many:many(nullable patient side)──> nurses   (via nurse_patient_assignments)
patients ──1:many(nullable FK)──> appointments
patients ──1:many(nullable FK)──> medical_records
patients ──1:many(nullable FK)──> payments

doctors ──1:many(nullable FK)──> appointments
doctors ──1:many(nullable FK)──> medical_records

medical_records ──1:many──> prescriptions (medical_record_id, nullable side)
medical_records ──1:many──> lab_results
medical_records ──1:many──> medical_record_attachments

appointments ──1:many(nullable FK)──> payments

services: standalone catalog, no inbound FK (payments.service_name stays denormalized text — see open question in DECISIONS.md)
```

Only the `users → {patients,doctors,nurses,receptionists}` relationships are unconditional 1:1 foreign keys mirroring an existing, always-enforced Mongoose `ref`. Every FK from `appointments`, `medical_records`, and `payments` to `patients`/`doctors` is declared **nullable** with `ON DELETE SET NULL`, because the source data (`Schema.Types.Mixed` `patientId`/`doctorId`) includes synthetic placeholder strings (`PT-####`, `doc-###`) that will not resolve to a real row — see the `legacy_*_ref` columns below and the migration-risk notes in `MIGRATION_PLAN.md`.

---

## `users`

Source: `user.model.ts`. One row per login-capable account (staff or patient).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| role | VARCHAR(20) | NOT NULL, CHECK IN ('Super Admin','Doctor','Nurse','Receptionist','Patient') |
| avatar | TEXT | NOT NULL DEFAULT '' |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Active', CHECK IN ('Active','On Leave','Inactive') |
| phone | VARCHAR(50) | NOT NULL |
| refresh_token | TEXT | NULL — current single active refresh token, ported as-is (plaintext today; see security note below) |
| password_reset_token_hash | TEXT | NULL |
| password_reset_expires_at | TIMESTAMPTZ | NULL |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `UNIQUE(email)`; `(email, is_deleted)`; `(role, is_deleted)`.

**Security note (not fixed in this phase, per instructions):** `refresh_token` is stored in plaintext in Mongo today, and this design ports it as plaintext for behavioral equivalence. Hashing it (as `password_reset_token_hash` already is) is a legitimate future hardening step but is an *authentication behavior change*, out of scope here.

---

## `patients`

Source: `patient.model.ts` (`strict:false`). The `Mixed`/array fields (`prescriptions`, `reports`, `billingInvoices`, `medicalHistory`) are normalized into their own tables (below); `vitals` (a single fixed-shape object, not a list) is flattened into typed columns here.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| user_id | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL |
| patient_code | VARCHAR(50) | NULL |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(50) | NOT NULL |
| avatar | TEXT | NOT NULL DEFAULT '' |
| age | INT | NOT NULL DEFAULT 35 |
| date_of_birth | DATE | NULL |
| gender | VARCHAR(10) | NOT NULL DEFAULT 'Male', CHECK IN ('Male','Female','Other') |
| blood_group | VARCHAR(5) | NOT NULL DEFAULT 'O+' |
| blood_type | VARCHAR(5) | NOT NULL DEFAULT 'O+' — kept as a separate duplicate column; see `DECISIONS.md` open question |
| address | TEXT | NOT NULL DEFAULT 'Hospital Ward' |
| department | VARCHAR(255) | NOT NULL DEFAULT 'General Medicine' |
| attending_doctor_name | VARCHAR(255) | NOT NULL DEFAULT 'Dr. Alex Morgan' — denormalized text, **not** a `doctor_id` FK (no such relationship exists in the current app) |
| room | VARCHAR(50) | NOT NULL DEFAULT 'Room 101' |
| condition | VARCHAR(255) | NOT NULL DEFAULT 'Stable' |
| admission_date | DATE | NULL |
| emergency_contact_name | VARCHAR(255) | NOT NULL DEFAULT 'Next of Kin' |
| emergency_contact_relationship | VARCHAR(100) | NOT NULL DEFAULT 'Family' |
| emergency_contact_phone | VARCHAR(50) | NOT NULL DEFAULT '' |
| allergies | TEXT[] | NOT NULL DEFAULT '{}' |
| insurance_provider | VARCHAR(255) | NOT NULL DEFAULT '' |
| insurance_policy_number | VARCHAR(255) | NOT NULL DEFAULT '' |
| vital_blood_pressure | VARCHAR(20) | NOT NULL DEFAULT '120/80' |
| vital_heart_rate | INT | NOT NULL DEFAULT 72 |
| vital_temperature | NUMERIC(4,1) | NOT NULL DEFAULT 98.6 |
| vital_oxygen_saturation | INT | NOT NULL DEFAULT 98 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Admitted' — not a `CHECK`-constrained enum: current Mongoose field is a free string; frontend UI only offers `Admitted/Outpatient/Discharged/Emergency` but the DB layer never enforced it, so adding a CHECK here would be a new restriction. Documented, not applied. |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `(user_id)`; `(patient_code)`; `(status, is_deleted)`; a GIN full-text index over `name || email || phone` replacing Mongo's `text` index.

**`strict:false` compatibility impact:** Mongo documents may contain undeclared fields not in this list. `REQUIRES VERIFICATION` — a live-data audit (sampling real `patients` documents) is needed before Phase 7 migration to confirm no other real field is silently in use; this design covers every field the schema and Zod validation declare today.

---

## `doctors`

Source: `doctor.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| user_id | UUID | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE |
| name / email / phone | VARCHAR | NOT NULL |
| avatar | TEXT | NOT NULL DEFAULT '' |
| age | INT | NULL, CHECK (age BETWEEN 18 AND 120) |
| address | TEXT | NOT NULL DEFAULT '' |
| specialization | VARCHAR(255) | NOT NULL |
| department | VARCHAR(255) | NOT NULL |
| license_number | VARCHAR(100) | NOT NULL, UNIQUE |
| experience | VARCHAR(100) | NOT NULL — kept as free text ("14 Years"), matching current Mongoose type |
| consultation_fee | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) |
| availability | VARCHAR(255) | NOT NULL DEFAULT 'Mon-Fri, 09:00 AM - 05:00 PM' |
| rating | NUMERIC(2,1) | NOT NULL DEFAULT 4.8, CHECK (BETWEEN 0 AND 5) |
| total_patients | INT | NOT NULL DEFAULT 0 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Active', CHECK IN ('Active','On Leave','Inactive') |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `UNIQUE(user_id)`; `UNIQUE(license_number)`; `(department, status)`; `(specialization)`.

Frontend `Doctor` type fields not present in Mongoose or here (`degrees`, `experienceYears`, `bio`, `expertise[]`, `officeRoom`, `dutySchedule[]`, `languages[]`, `reviews[]`) are **not included** — they are not persisted anywhere in the current backend, so inventing columns for them would not be supported by existing application behavior.

---

## `nurses`

Source: `nurse.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| user_id | UUID | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE |
| name / email / phone | VARCHAR | NOT NULL |
| address | TEXT | NOT NULL DEFAULT '' |
| avatar | TEXT | NOT NULL DEFAULT '' |
| department | VARCHAR(255) | NOT NULL |
| shift | VARCHAR(20) | NOT NULL, CHECK IN ('Morning','Evening','Night') |
| license_number | VARCHAR(100) | NOT NULL, UNIQUE |
| assigned_ward | VARCHAR(255) | NOT NULL |
| patient_load | INT | NOT NULL DEFAULT 0 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Active', CHECK IN ('Active','On Leave','Inactive') |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `UNIQUE(user_id)`; `UNIQUE(license_number)`; `(department, shift)`.

### `nurse_patient_assignments` (junction table, new)

Replaces `Nurse.assignedPatientIds: [String]`. This *is* a real existing many-to-many relationship in the app — just modeled as a raw string array today — so normalizing it into a junction table is a faithful port, not an invented relationship.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK — added so an unresolved assignment (see below) still has a stable row identity; the natural key `(nurse_id, patient_id)` can't serve as PK once `patient_id` is nullable |
| nurse_id | UUID | NOT NULL, REFERENCES nurses(id) ON DELETE CASCADE |
| patient_id | UUID | NULL, REFERENCES patients(id) ON DELETE CASCADE |
| legacy_patient_ref | TEXT | NULL — verbatim copy of the original `assignedPatientIds` string when it doesn't resolve to a real `patients.id` |
| assigned_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Unique index: `(nurse_id, patient_id)` where `patient_id IS NOT NULL` (partial unique index — prevents duplicate resolved assignments while still allowing multiple unresolved rows per nurse).

**Correction from the Phase 4 verification pass:** the original design had both `nurse_id`/`patient_id` as `NOT NULL`, which would have silently dropped any assignment whose string doesn't resolve to a real patient. Verification against `nurses.repository.ts`'s demo/fallback data confirmed `assignedPatientIds` entries like `'p-1'`, `'p-8'`, `'p-16'` — short placeholder strings, not valid Mongo ObjectIds — are a genuine, expected shape in this data, not a hypothetical edge case. `patient_id` is now nullable with a `legacy_patient_ref` fallback column, matching the same pattern used on `appointments`/`medical_records`/`payments`, so no assignment record is dropped during Phase 7 migration regardless of whether its string resolves.

---

## `receptionists`

Source: `receptionist.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| user_id | UUID | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE |
| name / email / phone | VARCHAR | NOT NULL |
| address | TEXT | NOT NULL DEFAULT '' |
| avatar | TEXT | NOT NULL DEFAULT '' |
| department | VARCHAR(255) | NOT NULL |
| shift | VARCHAR(20) | NOT NULL, CHECK IN ('Morning','Evening','Night') |
| desk_number | VARCHAR(50) | NOT NULL |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Active', CHECK IN ('Active','On Leave','Inactive') |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `UNIQUE(user_id)`; `(department)`; `(shift)` — two separate single-column indexes, **not** a compound `(department, shift)` index. **Correction from the Phase 4 verification pass:** `receptionist.model.ts` has zero `schema.index()` calls — only Mongoose's field-level `index:true` on `department` and `shift` individually. The compound index shown for `nurses` above is real (`nurse.model.ts` does call `nurseSchema.index({department:1,shift:1})`); the same compound index was mistakenly also written for `receptionists` in the original Phase 4 draft. Fixed here to match the two separate indexes that actually exist.

---

## `appointments`

Source: `appointment.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| patient_id | UUID | NULL, REFERENCES patients(id) ON DELETE SET NULL |
| legacy_patient_ref | TEXT | NULL — verbatim copy of the original Mixed `patientId` value when it did not resolve to a real `patients.id` |
| doctor_id | UUID | NULL, REFERENCES doctors(id) ON DELETE SET NULL |
| legacy_doctor_ref | TEXT | NULL — same pattern for `doctorId` |
| patient_name / doctor_name | VARCHAR(255) | NOT NULL — kept as denormalized display copies, matching current app behavior |
| department | VARCHAR(255) | NOT NULL |
| appointment_date | DATE | NOT NULL |
| appointment_time | TIME | NOT NULL |
| type | VARCHAR(20) | NOT NULL DEFAULT 'Consultation', CHECK IN ('In-Person','Video Call','Follow-up','Emergency','Procedure','Check-up','Consultation') |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Pending', CHECK IN ('Pending','Confirmed','Completed','Cancelled') |
| symptoms | TEXT | NOT NULL DEFAULT '' |
| notes | TEXT | NOT NULL DEFAULT '' |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `(appointment_date, doctor_id, status)`; `(patient_id, appointment_date DESC)`.

**Migration risk (highest-priority item, carried from `DATABASE_SCHEMA.md`):** `patientId`/`doctorId` are `Schema.Types.Mixed` today, defaulting to synthetic strings (`PT-####`, `doc-###`) rather than real ObjectIds when not supplied. During Phase 7 data migration, each existing document's `patientId`/`doctorId` must be checked against real `patients`/`doctors` `legacy_mongo_id`s; a match sets `patient_id`/`doctor_id`, a non-match leaves the FK `NULL` and preserves the original value in `legacy_patient_ref`/`legacy_doctor_ref`. No row is rejected or dropped for this reason — the FK is nullable specifically to accommodate this.

---

## `medical_records`

Source: `medical-record.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| patient_id | UUID | NULL, REFERENCES patients(id) ON DELETE SET NULL |
| legacy_patient_ref | TEXT | NULL (same pattern as appointments) |
| patient_name | VARCHAR(255) | NOT NULL |
| patient_code | VARCHAR(50) | NOT NULL DEFAULT '' |
| doctor_id | UUID | NULL, REFERENCES doctors(id) ON DELETE SET NULL |
| legacy_doctor_ref | TEXT | NULL |
| doctor_name | VARCHAR(255) | NOT NULL DEFAULT '' |
| record_code | VARCHAR(50) | NOT NULL DEFAULT '' |
| report_type | VARCHAR(100) | NOT NULL DEFAULT 'Diagnostic Report' |
| category | VARCHAR(100) | NOT NULL DEFAULT 'General' |
| record_date | DATE | NOT NULL |
| diagnosis | TEXT | NOT NULL |
| treatment | TEXT | NOT NULL DEFAULT '' |
| symptoms | TEXT[] | NOT NULL DEFAULT '{}' |
| vital_blood_pressure / vital_heart_rate / vital_temperature / vital_weight / vital_height | VARCHAR(20) | NOT NULL DEFAULT '' each — kept as strings, matching `vitalSignsSchema`'s actual (all-string) Mongoose types, not the numeric types `Patient.vitals` uses |
| status | VARCHAR(50) | NOT NULL DEFAULT 'Active' — free text, no CHECK (current Mongoose field is unconstrained) |
| lab_result_summary | TEXT | NOT NULL DEFAULT '' |
| notes | TEXT | NOT NULL DEFAULT '' |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(patient_id, record_date DESC)`.

Same `patient_id`/`doctor_id` nullable-FK-plus-`legacy_*_ref` migration pattern as `appointments`, including the hardcoded `'doc-1'`/`'Dr. Sarah Jenkins'` defaults noted in `DATABASE_SCHEMA.md` as a pre-existing demo-data leak into the schema default — ported as-is (the column default), not fixed.

---

## `prescriptions` (normalized, new — shared table)

Source: **two independent** Mongo locations with no cross-link today — `Patient.prescriptions` (Mixed array) and `MedicalRecord.prescription` (Mixed array, despite an unused `prescriptionSchema` being defined). This design merges them into one table with two independent nullable parent FKs, since the *row shape* is identical in both sources' documented interfaces (`Prescription`/`IPrescriptionItem`).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | NULL, not unique (each row came from an array item, not its own document) |
| patient_id | UUID | NULL, REFERENCES patients(id) ON DELETE CASCADE |
| medical_record_id | UUID | NULL, REFERENCES medical_records(id) ON DELETE CASCADE |
| medicine_name | VARCHAR(255) | NOT NULL (`medication` in MedicalRecord's sub-schema, `medicineName` in Patient's — reconciled to one column name here) |
| dosage | VARCHAR(100) | NOT NULL |
| frequency | VARCHAR(100) | NOT NULL |
| duration | VARCHAR(100) | NOT NULL |
| prescribed_by | VARCHAR(255) | NULL (Patient-sourced rows only) |
| start_date / end_date | DATE | NULL (Patient-sourced rows only) |
| status | VARCHAR(50) | NULL (Patient-sourced rows only) |
| instructions | TEXT | NULL |
| outcome_result | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Constraint: `CHECK (patient_id IS NOT NULL OR medical_record_id IS NOT NULL)` — every row must belong to at least one parent.

**Open question (see `DECISIONS.md`):** whether Patient-sourced and MedicalRecord-sourced prescriptions should actually be the *same* clinical record (in which case both FKs should eventually be populated on one row) is not something the current application establishes — they are two independently-maintained lists today. This design keeps them mergeable structurally but does not assume they're the same data.

---

## `lab_results` (normalized, new)

Source: `MedicalRecord.labResults` (`[Object]`, with an unused `labResultSchema`).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | NULL |
| medical_record_id | UUID | NOT NULL, REFERENCES medical_records(id) ON DELETE CASCADE |
| test_name | VARCHAR(255) | NOT NULL |
| result | VARCHAR(255) | NOT NULL |
| result_date | DATE | NOT NULL |
| normal_range | VARCHAR(255) | NOT NULL |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('Normal','Abnormal') |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(medical_record_id)`.

---

## `medical_record_attachments` (normalized, new)

Source: `MedicalRecord.attachments` (`[Object]`). No upload endpoint currently populates this (`API_CONTRACTS.md`); table modeled from the shape base64/string fields imply.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | NULL |
| medical_record_id | UUID | NOT NULL, REFERENCES medical_records(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| url | TEXT | NOT NULL — current app has no file upload; this holds whatever string (base64 or URL) the API accepted, unchanged |
| file_size | BIGINT | NULL |
| file_type | VARCHAR(100) | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(medical_record_id)`.

---

## `patient_reports` (normalized, new)

Source: `Patient.reports` (Mixed array; frontend `PatientReport[]`).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | NULL |
| patient_id | UUID | NOT NULL, REFERENCES patients(id) ON DELETE CASCADE |
| title | VARCHAR(255) | NOT NULL |
| report_date | DATE | NOT NULL |
| category | VARCHAR(100) | NULL |
| doctor_name | VARCHAR(255) | NULL |
| status | VARCHAR(50) | NULL |
| diagnosis | TEXT | NULL |
| summary | TEXT | NULL |
| notes | TEXT | NULL |
| file_name | VARCHAR(255) | NULL |
| file_type | VARCHAR(100) | NULL |
| file_size | BIGINT | NULL |
| file_url | TEXT | NULL |
| uploaded_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(patient_id)`.

### `patient_report_attachments` (normalized, new — nested one level further)

Source: `PatientReport.attachments?: ReportAttachment[]` (frontend type; another level of nesting inside the already-Mixed `reports` array).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| patient_report_id | UUID | NOT NULL, REFERENCES patient_reports(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| url | TEXT | NOT NULL |
| file_size | BIGINT | NULL |
| file_type | VARCHAR(100) | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

---

## `invoices` (normalized, new)

Source: `Patient.billingInvoices` (Mixed array; frontend `PatientBillingRecord[]`).

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | NULL |
| patient_id | UUID | NOT NULL, REFERENCES patients(id) ON DELETE CASCADE |
| invoice_number | VARCHAR(100) | NOT NULL |
| invoice_date | DATE | NOT NULL |
| description | TEXT | NULL |
| total_amount | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) |
| paid_amount | NUMERIC(10,2) | NOT NULL DEFAULT 0, CHECK (>= 0) |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('Paid','Pending','Partial','Overdue','Refunded') |
| insurance_provider | VARCHAR(255) | NULL |
| payment_method | VARCHAR(50) | NULL |
| partial_reason | TEXT | NULL |
| next_payment_date | DATE | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(patient_id)`.

**Open question (see `DECISIONS.md`):** this table and the standalone `payments` table (below) model conceptually overlapping data (both represent a bill/charge against a patient) from two different, unlinked Mongo sources (`Patient.billingInvoices` vs. the top-level `Payment` collection). The current app never cross-references them. This design keeps them separate, faithful to today's behavior, and flags the redundancy rather than silently merging it.

---

## `patient_visit_history` (normalized, new)

Source: `Patient.medicalHistory` (Mixed array). **Shape ambiguity, documented as a migration risk, not resolved:** the backend default/seeder writes this as a plain array of strings (e.g. `['Hypertension','Mild Asthma']`), but the frontend's `VisitHistoryItem` interface expects structured objects (`{id,date,visitType,doctorName,department,diagnosis,notes}`). This table is shaped for the richer, apparently-intended structure; Phase 7 migration will need to wrap any bare-string legacy entries into a row with only `diagnosis` (or `notes`) populated and the rest `NULL`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| patient_id | UUID | NOT NULL, REFERENCES patients(id) ON DELETE CASCADE |
| visit_date | DATE | NULL |
| visit_type | VARCHAR(100) | NULL |
| doctor_name | VARCHAR(255) | NULL |
| department | VARCHAR(255) | NULL |
| diagnosis | TEXT | NULL |
| notes | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(patient_id)`.

---

## `payments`

Source: `payment.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| patient_id | UUID | NULL, REFERENCES patients(id) ON DELETE SET NULL |
| legacy_patient_ref | TEXT | NULL |
| patient_name | VARCHAR(255) | NOT NULL |
| appointment_id | UUID | NULL, REFERENCES appointments(id) ON DELETE SET NULL |
| legacy_appointment_ref | TEXT | NULL |
| service_name | VARCHAR(255) | NOT NULL — denormalized text, **no FK to `services`** (the app never references Service by ID from Payment; see open question) |
| amount | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) |
| status | VARCHAR(20) | NOT NULL DEFAULT 'Pending', CHECK IN ('Paid','Pending','Partial','Overdue','Refunded') |
| payment_date | DATE | NOT NULL |
| due_date | DATE | NOT NULL |
| payment_method | VARCHAR(50) | NOT NULL — free text (TS union type is not enforced by Mongoose today; not tightened here) |
| transaction_id | VARCHAR(255) | NOT NULL DEFAULT '' |
| partial_reason | TEXT | NOT NULL DEFAULT '' |
| next_payment_date | DATE | NULL |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(status, payment_date DESC)`.

**Field-drift open question (see `DECISIONS.md`):** the Zod validation layer for this module already accepts `totalAmount`/`paidAmount`/`invoiceNo`/`insuranceProvider`/`claimId`/`serviceType`/`description` in request bodies, but Mongoose only persists `amount`/`serviceName` — those extra fields are silently dropped today. This schema ports only what is actually persisted (`amount`, `serviceName`); adding columns for the dropped fields would start capturing data the app currently discards, which is a behavior change outside this phase's scope.

---

## `services`

Source: `service.model.ts`. Standalone catalog, no inbound FKs from any existing relationship.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| name | VARCHAR(255) | NOT NULL, UNIQUE |
| category | VARCHAR(100) | NOT NULL |
| department | VARCHAR(255) | NOT NULL |
| cost | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) |
| description | TEXT | NOT NULL |
| duration_minutes | INT | NOT NULL, CHECK (>= 1) |
| is_available | BOOLEAN | NOT NULL DEFAULT true |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Indexes: `UNIQUE(name)`; `(category)`; `(department)`; `(is_available)`; `(is_deleted)` — separate single-column indexes matching `service.model.ts`'s field-level `index:true` declarations. **Added during the Phase 4 verification pass** — the original draft omitted an explicit Indexes line for this table; `service.model.ts` has no `schema.index()` calls (compound indexes), only field-level ones, confirmed directly against source.

---

## `activity_logs`

Source: `activity-log.model.ts`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| legacy_mongo_id | TEXT | UNIQUE |
| user_display | TEXT | NOT NULL — verbatim port of the current `user` free-text field (name/email snapshot) |
| user_id | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL — **new, optional column; population DEFERRED to a future implementation phase.** The current app has no `user_id` on this collection. Verified against `activity-logger.ts`: the calling code does receive `actor.id` at the point an activity log is written, but today it discards that id into a formatted display string (`"${actor.name} (${actor.role})"`) before persisting — no code path stores or looks up a raw user id. Populating this column reliably would require an application-code change (capturing `actor.id` alongside the display string), which is out of scope for a schema-design-only phase. The column is kept in the design (harmless, nullable) but whether/how to populate it is explicitly deferred — see `DECISIONS.md`. |
| action | VARCHAR(100) | NOT NULL |
| details | TEXT | NOT NULL |
| occurred_at | TIMESTAMPTZ | NOT NULL DEFAULT now() — replaces the redundant free-text `time` field |
| ip_address | VARCHAR(64) | NOT NULL DEFAULT '' |
| is_deleted | BOOLEAN | NOT NULL DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Index: `(created_at DESC)`.

---

## Tables intentionally NOT created

- **`departments`** — no backend module or Mongoose collection for departments exists today; it is frontend-only (`departmentService.ts`, localStorage). Creating a `departments` table now would be inventing a relationship the current app doesn't have. Left as an open question in `DECISIONS.md` for a future phase to decide, consistent with `DECISIONS.md`'s existing "explicitly NOT yet made" list.
- **`refresh_tokens` / `password_reset_tokens` as separate tables** — the current app supports exactly one active refresh token per user and one active reset token per user, stored inline on `User`. A separate table would imply multi-session/multi-token support the app doesn't have. Kept as nullable columns on `users` instead, matching current behavior exactly.
- **Any `notifications`, `reports` (system-level), or file-storage table** — `API_CONTRACTS.md` confirms these endpoints don't exist in the current backend.
