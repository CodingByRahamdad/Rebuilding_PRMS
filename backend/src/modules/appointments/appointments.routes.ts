import { Router } from 'express';
import { AppointmentController } from './appointments.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentsQuerySchema,
  appointmentIdParamSchema,
} from './appointments.validation';

const appointmentRouter = Router();
const appointmentController = new AppointmentController();

appointmentRouter.use(authenticate);

appointmentRouter.post('/', authorize('Super Admin', 'Receptionist', 'Doctor', 'Patient'), validate(createAppointmentSchema), appointmentController.createAppointment);
appointmentRouter.get('/', validate(getAppointmentsQuerySchema), appointmentController.getAppointments);
appointmentRouter.get('/:id', validate(appointmentIdParamSchema), appointmentController.getAppointmentById);
appointmentRouter.put('/:id', authorize('Super Admin', 'Receptionist', 'Doctor'), validate(updateAppointmentSchema), appointmentController.updateAppointment);
appointmentRouter.delete('/:id', authorize('Super Admin', 'Receptionist', 'Doctor'), validate(appointmentIdParamSchema), appointmentController.deleteAppointment);

export default appointmentRouter;
