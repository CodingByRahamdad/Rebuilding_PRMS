import { z } from 'zod';

const emergencyContactSchema = z.object({
  name: z.string().optional().default('Next of Kin'),
  relationship: z.string().optional().default('Family'),
  relation: z.string().optional(),
  phone: z.string().optional().default(''),
}).passthrough();

export const createPatientSchema = z.object({
  body: z.object({
    patientCode: z.string().optional(),
    name: z.string().min(2, 'Full name is required (min 2 characters)'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    phone: z.string().min(5, 'Phone number is required'),
    avatar: z.string().optional().default(''),
    age: z.union([z.number().min(0).max(130), z.string().transform((v) => Number(v))]),
    dateOfBirth: z.string().optional().default(''),
    gender: z.enum(['Male', 'Female', 'Other'], { message: 'Gender selection is required' }),
    bloodGroup: z.string().min(1, 'Blood type is required'),
    bloodType: z.string().optional(),
    address: z.string().min(1, 'Residential address is required'),
    department: z.string().min(1, 'Department is required'),
    doctor: z.string().min(1, 'Attending doctor is required'),
    room: z.string().optional().default('Room 101'),
    condition: z.string().min(1, 'Primary condition is required'),
    admissionDate: z.string().optional(),
    emergencyContact: emergencyContactSchema.optional().default({ name: 'Next of Kin', relationship: 'Family', phone: '' }),
    medicalHistory: z.any().optional().default([]),
    allergies: z.array(z.string()).optional().default([]),
    insuranceProvider: z.string().optional().default(''),
    insurancePolicyNumber: z.string().optional().default(''),
    prescriptions: z.any().optional().default([]),
    reports: z.any().optional().default([]),
    billingInvoices: z.any().optional().default([]),
    vitals: z.any().optional(),
    status: z.string().min(1, 'Triage status is required'),
  }).passthrough(),
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Patient ID is required'),
  }),
  body: z.object({
    patientCode: z.string().optional(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    avatar: z.string().optional(),
    age: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    bloodGroup: z.string().optional(),
    bloodType: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    doctor: z.string().optional(),
    room: z.string().optional(),
    condition: z.string().optional(),
    admissionDate: z.string().optional(),
    emergencyContact: emergencyContactSchema.optional(),
    medicalHistory: z.any().optional(),
    allergies: z.array(z.string()).optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    prescriptions: z.any().optional(),
    reports: z.any().optional(),
    billingInvoices: z.any().optional(),
    vitals: z.any().optional(),
    status: z.string().optional(),
  }).passthrough(),
});

export const getPatientsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 15)),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    bloodGroup: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const patientIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Patient ID is required'),
  }),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];
export type GetPatientsQuery = z.infer<typeof getPatientsQuerySchema>['query'];
