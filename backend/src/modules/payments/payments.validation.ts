import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    invoiceNo: z.string().optional(),
    invoiceNumber: z.string().optional(),
    patientId: z.string().min(1, 'Patient ID is required'),
    patientName: z.string().min(1, 'Patient name is required'),
    appointmentId: z.string().optional(),
    serviceName: z.string().optional(),
    serviceType: z.string().optional(),
    description: z.string().optional(),
    amount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional().default(0),
    totalAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
    paidAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
    status: z.string().optional().default('Pending'),
    date: z.string().optional(),
    dueDate: z.string().optional(),
    paymentMethod: z.string().optional().default('Credit Card'),
    insuranceProvider: z.string().optional().default(''),
    claimId: z.string().optional().default(''),
    transactionId: z.string().optional().default(''),
    partialReason: z.string().optional().default(''),
    nextPaymentDate: z.string().optional().default(''),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
  body: z.object({
    invoiceNo: z.string().optional(),
    invoiceNumber: z.string().optional(),
    patientId: z.string().optional(),
    patientName: z.string().optional(),
    appointmentId: z.string().optional(),
    serviceName: z.string().optional(),
    serviceType: z.string().optional(),
    description: z.string().optional(),
    amount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
    totalAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
    paidAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
    status: z.string().optional(),
    date: z.string().optional(),
    dueDate: z.string().optional(),
    paymentMethod: z.string().optional(),
    insuranceProvider: z.string().optional(),
    claimId: z.string().optional(),
    transactionId: z.string().optional(),
    partialReason: z.string().optional(),
    nextPaymentDate: z.string().optional(),
  }),
});

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
    patientId: z.string().optional(),
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
    search: z.string().optional(),
    timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>['body'];
export type GetPaymentsQuery = z.infer<typeof getPaymentsQuerySchema>['query'];
