import { z } from 'zod';

export const appointmentTypeEnum = z.enum([
  'In-Person',
  'Video Call',
  'Follow-up',
  'Emergency',
  'Procedure',
  'Check-up',
  'Consultation',
]);

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().optional(),
    patientName: z.string().min(1, 'Patient name is required'),
    doctorId: z.string().optional(),
    doctorName: z.string().min(1, 'Doctor name is required'),
    department: z.string().min(1, 'Department is required'),
    date: z.string().min(1, 'Appointment date is required'),
    time: z.string().min(1, 'Appointment time is required'),
    type: appointmentTypeEnum.or(z.string()).optional().default('Consultation'),
    status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']).optional().default('Pending'),
    symptoms: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
  body: z.object({
    patientId: z.string().optional(),
    patientName: z.string().optional(),
    doctorId: z.string().optional(),
    doctorName: z.string().optional(),
    department: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    type: appointmentTypeEnum.or(z.string()).optional(),
    status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']).optional(),
    symptoms: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const getAppointmentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    department: z.string().optional(),
    date: z.string().optional(),
    status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']).optional(),
    type: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const appointmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>['query'];
