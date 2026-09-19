import { z } from 'zod';

export const createNurseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    phone: z.string().min(5, 'Phone number is required'),
    address: z.string().optional(),
    avatar: z.string().optional(),
    department: z.string().min(2, 'Department is required'),
    shift: z.enum(['Morning', 'Evening', 'Night']),
    licenseNumber: z.string().min(2, 'License number is required'),
    assignedWard: z.string().min(1, 'Assigned ward is required'),
    patientLoad: z.number().optional(),
    assignedPatientIds: z.array(z.string()).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional().default('Active'),
  }),
});

export const updateNurseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Nurse ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    department: z.string().min(2).optional(),
    shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
    licenseNumber: z.string().min(2).optional(),
    assignedWard: z.string().optional(),
    patientLoad: z.number().optional(),
    assignedPatientIds: z.array(z.string()).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  }),
});

export const getNursesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 15)),
    department: z.string().optional(),
    shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
    search: z.string().optional(),
  }),
});

export const nurseIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Nurse ID is required'),
  }),
});

export type CreateNurseInput = z.infer<typeof createNurseSchema>['body'];
export type UpdateNurseInput = z.infer<typeof updateNurseSchema>['body'];
export type GetNursesQuery = z.infer<typeof getNursesQuerySchema>['query'];
