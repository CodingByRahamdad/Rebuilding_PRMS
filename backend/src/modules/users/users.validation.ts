import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Super Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']),
    phone: z.string().min(5, 'Phone number is required'),
    avatar: z.string().optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional().default('Active'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['Super Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']).optional(),
    phone: z.string().min(5).optional(),
    avatar: z.string().optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  }),
});

export const getUserQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    role: z.enum(['Super Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
    search: z.string().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type GetUserQuery = z.infer<typeof getUserQuerySchema>['query'];
