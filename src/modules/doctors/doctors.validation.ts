import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    phone: z.string().min(5, 'Phone number is required'),
    avatar: z.string().optional(),
    age: z.union([z.number().min(18).max(120), z.string().transform((v) => (v ? parseInt(v, 10) : undefined))]).optional(),
    address: z.string().optional(),
    specialization: z.string().min(2, 'Specialization is required'),
    department: z.string().min(2, 'Department is required'),
    licenseNumber: z.string().min(2, 'License number is required'),
    experience: z.union([z.string(), z.number().transform((v) => `${v} Years`)]).optional().default('10 Years'),
    consultationFee: z.union([z.number().min(0), z.string().transform((v) => (v ? parseFloat(v) : 150))]).optional().default(150),
    availability: z.string().optional().default('Mon-Fri, 09:00 AM - 05:00 PM'),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional().default('Active'),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    avatar: z.string().optional(),
    age: z.union([z.number().min(18).max(120), z.string().transform((v) => (v ? parseInt(v, 10) : undefined))]).optional(),
    address: z.string().optional(),
    specialization: z.string().min(2).optional(),
    department: z.string().min(2).optional(),
    licenseNumber: z.string().min(2).optional(),
    experience: z.union([z.string(), z.number().transform((v) => `${v} Years`)]).optional(),
    consultationFee: z.union([z.number().min(0), z.string().transform((v) => (v ? parseFloat(v) : 150))]).optional(),
    availability: z.string().optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  }),
});

export const getDoctorsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 15)),
    department: z.string().optional(),
    specialization: z.string().optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
    search: z.string().optional(),
  }),
});

export const doctorIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body'];
export type GetDoctorsQuery = z.infer<typeof getDoctorsQuerySchema>['query'];
