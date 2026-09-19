import { z } from 'zod';

export const getActivityLogsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    user: z.string().optional(),
  }),
});

export const createActivityLogSchema = z.object({
  body: z.object({
    user: z.string().min(1, 'User name/email is required'),
    action: z.string().min(1, 'Action is required'),
    details: z.string().min(1, 'Details are required'),
    time: z.string().optional().default(new Date().toISOString()),
    ipAddress: z.string().optional().default('127.0.0.1'),
  }),
});

export type GetActivityLogsQuery = z.infer<typeof getActivityLogsQuerySchema>['query'];
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>['body'];
