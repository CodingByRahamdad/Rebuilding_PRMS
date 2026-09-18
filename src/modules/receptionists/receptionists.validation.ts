import { z } from 'zod';

export const createReceptionistSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    phone: z.string().min(5, 'Phone number is required'),
    address: z.string().optional(),
    avatar: z.string().optional(),
    department: z.string().min(2, 'Department is required'),
    shift: z.enum(['Morning', 'Evening', 'Night']),
    deskNumber: z.string().min(1, 'Desk number is required'),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional().default('Active'),
  }),
});

export const updateReceptionistSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Receptionist ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    department: z.string().min(2).optional(),
    shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
    deskNumber: z.string().optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  }),
});

export const getReceptionistsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 15)),
    department: z.string().optional(),
    shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
    search: z.string().optional(),
  }),
});

export const receptionistIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Receptionist ID is required'),
  }),
});

export type CreateReceptionistInput = z.infer<typeof createReceptionistSchema>['body'];
export type UpdateReceptionistInput = z.infer<typeof updateReceptionistSchema>['body'];
export type GetReceptionistsQuery = z.infer<typeof getReceptionistsQuerySchema>['query'];
