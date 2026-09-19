import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Service name must be at least 2 characters'),
    category: z.string().min(2, 'Category is required'),
    department: z.string().min(2, 'Department is required'),
    cost: z.number().min(0, 'Cost cannot be negative'),
    description: z.string().min(5, 'Description is required'),
    durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
    isAvailable: z.boolean().optional().default(true),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Service ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    department: z.string().min(2).optional(),
    cost: z.number().min(0).optional(),
    description: z.string().min(5).optional(),
    durationMinutes: z.number().min(1).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const getServicesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    department: z.string().optional(),
    category: z.string().optional(),
    isAvailable: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
    search: z.string().optional(),
  }),
});

export const serviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Service ID is required'),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];
export type GetServicesQuery = z.infer<typeof getServicesQuerySchema>['query'];
