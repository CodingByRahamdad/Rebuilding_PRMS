import { z } from 'zod';

const prescriptionItemSchema = z.object({
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
});

const labResultItemSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  result: z.string().min(1, 'Result is required'),
  date: z.string().min(1, 'Date is required'),
  normalRange: z.string().min(1, 'Normal range is required'),
  status: z.enum(['Normal', 'Abnormal']),
});

const vitalSignsSchema = z.object({
  bloodPressure: z.string().optional().default(''),
  heartRate: z.string().optional().default(''),
  temperature: z.string().optional().default(''),
  weight: z.string().optional().default(''),
  height: z.string().optional().default(''),
});

export const createMedicalRecordSchema = z.object({
  body: z.object({
    patientId: z.string().optional().default(''),
    patientName: z.string().min(1, 'Patient name is required'),
    patientCode: z.string().optional().default(''),
    doctorId: z.string().optional().default('doc-1'),
    doctorName: z.string().optional().default('Dr. Sarah Jenkins'),
    recordCode: z.string().optional(),
    reportType: z.string().optional().default('Diagnostic Report'),
    category: z.string().optional().default('General'),
    date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
    diagnosis: z.string().optional().default('Clinical Consultation'),
    treatment: z.string().optional().default(''),
    symptoms: z.array(z.string()).optional().default([]),
    prescription: z.any().optional(),
    labResults: z.array(z.any()).optional().default([]),
    labResultSummary: z.string().optional().default(''),
    vitalSigns: vitalSignsSchema.optional().default({
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
    }),
    status: z.string().optional().default('Active'),
    attachments: z.array(z.any()).optional().default([]),
    notes: z.string().optional().default(''),
  }),
});

export const updateMedicalRecordSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Medical record ID is required'),
  }),
  body: z.object({
    patientId: z.string().optional(),
    patientName: z.string().optional(),
    patientCode: z.string().optional(),
    doctorId: z.string().optional(),
    doctorName: z.string().optional(),
    recordCode: z.string().optional(),
    reportType: z.string().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    symptoms: z.array(z.string()).optional(),
    prescription: z.any().optional(),
    labResults: z.array(z.any()).optional(),
    labResultSummary: z.string().optional(),
    vitalSigns: vitalSignsSchema.optional(),
    status: z.string().optional(),
    attachments: z.array(z.any()).optional(),
    notes: z.string().optional(),
  }),
});

export const getMedicalRecordsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const medicalRecordIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Medical record ID is required'),
  }),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>['body'];
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>['body'];
export type GetMedicalRecordsQuery = z.infer<typeof getMedicalRecordsQuerySchema>['query'];
